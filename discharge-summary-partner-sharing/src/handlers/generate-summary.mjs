import { documentStatus, textractStatus } from "../constants/index.mjs";
import { envHelper } from "../helpers/index.mjs";
import {
  bedrockService,
  dynamoDBService,
  snsService,
  textractService,
} from "../services/index.mjs";
import logger from "../utils/logger.mjs";

const documentsTable = envHelper.getStringEnv("DOCUMENTS_DYNAMODB_TABLE");
const requestsTable = envHelper.getStringEnv("REQUESTS_DYNAMODB_TABLE");
const modelId = envHelper.getStringEnv(
  "BEDROCK_MODEL_ID",
  "amazon.nova-lite-v1:0"
);

export const handler = async (event) => {
  logger.info("generate summary lambda triggered");
  logger.debug(`event received :: ${JSON.stringify(event)}`);

  for (const record of event.Records) {
    let textractJobId, textractJobStatus, requestId, documentId;
    
    try {
      const messageBody = JSON.parse(record.body);
      const message = JSON.parse(messageBody.Message);
      textractJobId = message.JobId;
      textractJobStatus = message.Status;
      const document = message.DocumentLocation.S3ObjectName;
      [, requestId, , documentId] = document.split("/");
      
      const logPrefix = `processing record :: requestId :: ${requestId} :: documentId :: ${documentId} :: jobId :: ${textractJobId} :: textractJobStatus :: ${textractJobStatus}`;

      if (textractJobStatus === textractStatus.SUCCEEDED) {
        const pages = await textractService.getDocumentTextDetectionResults(
          textractJobId
        );

        // Get the current document to find patient ID
        const currentDocument = await dynamoDBService.getItem({
          TableName: documentsTable,
          Key: { documentId }
        });

        if (!currentDocument.Item) {
          logger.warn(`${logPrefix} :: current document not found`);
          continue;
        }

        const patientId = currentDocument.Item.patientId;
        
        if (!patientId) {
          logger.warn(`${logPrefix} :: document missing patientId, processing individually`);
          // Process as individual document without patient grouping
          const medicalInformation = await getMedicalInformation(pages);
          await updateDocumentItem(
            documentId,
            documentStatus.COMPLETED,
            pages,
            medicalInformation.data
          );
          await updateRequestStatus(requestId, "COMPLETED");
          continue;
        }
        
        logger.info(`${logPrefix} :: processing for patientId :: ${patientId}`);

        // Store extracted text for this document but keep it in processing state
        await updateDocumentItem(
          documentId,
          documentStatus.PROCESSING,
          pages,
          null // Don't generate individual summary yet
        );

        // Get all documents for this request (not just patient)
        const allRequestDocuments = await dynamoDBService.query({
          TableName: documentsTable,
          IndexName: "RequestIdIndex",
          KeyConditionExpression: "requestId = :requestId",
          ExpressionAttributeValues: {
            ":requestId": requestId
          }
        });

        const documentsWithPages = allRequestDocuments.Items.filter(
          doc => doc.pages && doc.pages.length > 0
        );
        const totalDocuments = allRequestDocuments.Items.length;

        if (documentsWithPages.length === totalDocuments) {
          // All documents in this request have pages extracted, generate combined summary
          logger.info(`${logPrefix} :: all ${totalDocuments} documents processed for request ${requestId}, generating combined summary`);
          
          const combinedSummary = await generateCombinedPatientSummary(documentsWithPages);
          
          // Update all documents in this request with the combined summary and mark as completed
          for (const doc of allRequestDocuments.Items) {
            await updateDocumentItem(
              doc.documentId,
              documentStatus.COMPLETED,
              doc.pages || [],
              combinedSummary.data
            );
          }

          // Update request status to completed
          await updateRequestStatus(requestId, "COMPLETED");

          await snsService.publishToSNS(
            `✅ Combined Summary Generated!\n\nRequest ID: ${requestId}\nPatient ID: ${patientId}\nDocuments Processed: ${totalDocuments}\nTotal Pages: ${documentsWithPages.reduce((sum, doc) => sum + (doc.pages?.length || 0), 0)}\nProcessing completed at: ${new Date().toISOString()}\n\nAll medical documents have been analyzed and a comprehensive summary is ready.`,
            "Document Processing Complete"
          );
        } else {
          logger.info(`${logPrefix} :: waiting for ${totalDocuments - documentsWithPages.length} more documents to complete text extraction for request ${requestId}`);
        }

      } else if (textractJobStatus === textractStatus.FAILED) {
        logger.warn(`${logPrefix} :: textract job failed`);
        await updateDocumentItem(
          documentId,
          documentStatus.ERROR,
          null,
          null,
          "text extraction failed"
        );
        await updateRequestStatus(requestId, "FAILED");
        await snsService.publishToSNS(
          `❌ Text Extraction Failed\n\nRequest ID: ${requestId}\nDocument ID: ${documentId}\nError: Textract job failed\nTime: ${new Date().toISOString()}`,
          "Document Processing Error"
        );
      } else {
        logger.info(`${logPrefix} :: textract job status: ${textractJobStatus} - no action needed`);
      }
    } catch (error) {
      const logPrefix = `processing error :: requestId :: ${requestId || 'unknown'} :: documentId :: ${documentId || 'unknown'}`;
      logger.error(`${logPrefix} :: error :: ${error.message}`);
      logger.error(`Error stack: ${error.stack}`);
      
      if (documentId) {
        try {
          await updateDocumentItem(documentId, documentStatus.ERROR, null, null, error.message);
        } catch (updateError) {
          logger.error(`Failed to update document ${documentId}: ${updateError.message}`);
        }
      }
      
      if (requestId) {
        try {
          await updateRequestStatus(requestId, "FAILED");
          await snsService.publishToSNS(
            `❌ Document Processing Error\n\nRequest ID: ${requestId}\nDocument ID: ${documentId || 'unknown'}\nError: ${error.message}\nTime: ${new Date().toISOString()}`,
            "Document Processing Error"
          );
        } catch (notificationError) {
          logger.error(`Failed to send error notification: ${notificationError.message}`);
        }
      }
    }
  }
};

const updateDocumentItem = async (
  documentId,
  documentStatus,
  pages = null,
  summary = null,
  errorMessage = null
) => {
  const setExpressions = [
    "updatedAt = :updatedAt",
    "documentStatus = :documentStatus",
  ];
  const removeExpressions = [];
  const expressionAttributeValues = {
    ":updatedAt": new Date().toISOString(),
    ":documentStatus": documentStatus,
  };

  if (errorMessage) {
    setExpressions.push("errorMessage = :errorMessage");
    expressionAttributeValues[":errorMessage"] = errorMessage;
  } else {
    // Remove error message if document is being marked as legitimate
    removeExpressions.push("errorMessage");
  }

  if (pages !== null) {
    setExpressions.push("pages = :pages");
    expressionAttributeValues[":pages"] = pages;
  }

  if (summary !== null) {
    setExpressions.push("summary = :summary");
    expressionAttributeValues[":summary"] = summary;
  }

  // Build the UpdateExpression
  let updateExpression = "";
  const params = {
    Key: {
      documentId,
    },
    TableName: documentsTable,
  };

  if (setExpressions.length > 0) {
    updateExpression += "SET " + setExpressions.join(", ");
    params.ExpressionAttributeValues = expressionAttributeValues;
  }
  
  if (removeExpressions.length > 0) {
    if (updateExpression) updateExpression += " ";
    updateExpression += "REMOVE " + removeExpressions.join(", ");
  }

  params.UpdateExpression = updateExpression;

  const logPrefix = `updating item :: documentId :: ${documentId} :: documentStatus :: ${documentStatus}`;
  try {
    await dynamoDBService.updateItem(params);
    logger.debug(`${logPrefix} :: document updated`);
  } catch (error) {
    logger.error(`${logPrefix} :: document update failed :: error :: ${error}`);
    throw error;
  }
};

const updateRequestStatus = async (requestId, status) => {
  const params = {
    Key: { requestId },
    TableName: requestsTable,
    UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
    ExpressionAttributeNames: { "#status": "status" },
    ExpressionAttributeValues: {
      ":status": status,
      ":updatedAt": new Date().toISOString(),
    },
  };

  try {
    await dynamoDBService.updateItem(params);
    logger.info(`Request ${requestId} status updated to ${status}`);
  } catch (error) {
    logger.error(`Failed to update request ${requestId} status: ${error.message}`);
    throw error;
  }
};

const generateCombinedPatientSummary = async (documents) => {
  const logPrefix = `generateCombinedPatientSummary`;
  try {
    // Combine all pages from all documents
    const allPages = [];
    documents.forEach((doc, docIndex) => {
      if (doc.pages && doc.pages.length > 0) {
        doc.pages.forEach((page, pageIndex) => {
          allPages.push(`Document ${docIndex + 1}, Page ${pageIndex + 1}: ${page}`);
        });
      }
    });

    const combinedText = allPages.join("\n\n");
    logger.info(`${logPrefix} :: processing ${documents.length} documents with ${allPages.length} total pages`);

    return await getMedicalInformation(allPages);
  } catch (error) {
    logger.error(`${logPrefix} :: error :: ${error.message}`);
    throw error;
  }
};

const getMedicalInformation = async (pagesArray) => {
  const logPrefix = `getMedicalInformation`;
  try {
    const formattedPages = pagesArray
      .map((page, index) => `Page ${index + 1}: ${page}`)
      .join("\n\n");

    const requiredFields = [
      "patientName",
      "age",
      "gender",
      "admittingDoctor",
      "ipNo",
      "summaryNumber",
      "admissionDate",
      "dischargeDate",
      "diagnosis",
      "presentingComplaints",
      "pastHistory",
      "systemicExamination",
      "keyInvestigationSummary",
      "hospitalCourse",
      "hospitalizationTreatment",
      "dischargeTreatment",
      "advice",
      "preventiveCare",
      "obtainUrgentCare",
      "totalCharges",
      "insuranceCoverage",
      "patientResponsibility",
      "paymentStatus",
      "billingNotes",
    ];

    const prompt = {
      inferenceConfig: {
        maxTokens: 5000,
      },
      messages: [
        {
          role: "user",
          content: [
            {
              text: `You are a medical data extraction assistant. You MUST return ONLY valid JSON. Do NOT include any text before or after the JSON. NEVER use emojis, decorative characters, special symbols, or formatting symbols. Use only plain text.

Extract medical information from the documents and return ONLY this JSON structure:

{
  "data": {
    "patientName": "string",
    "age": "string", 
    "gender": "string",
    "admittingDoctor": "string",
    "ipNo": "string",
    "summaryNumber": "string",
    "admissionDate": "YYYY-MM-DD",
    "dischargeDate": "YYYY-MM-DD", 
    "diagnosis": "string",
    "presentingComplaints": "string",
    "pastHistory": "string",
    "systemicExamination": "[{\\"label\\": \\"Test\\", \\"admission\\": \\"Value\\"}]",
    "keyInvestigationSummary": "string",
    "hospitalCourse": "string", 
    "hospitalizationTreatment": "string",
    "dischargeTreatment": "[{\\"drugName\\": \\"Name\\", \\"dosage\\": \\"Amount\\", \\"frequency\\": \\"Times\\", \\"numberOfDays\\": \\"Days\\", \\"remark\\": \\"Notes\\"}]",
    "advice": "string",
    "preventiveCare": "string", 
    "obtainUrgentCare": "string",
    "totalCharges": "string",
    "insuranceCoverage": "string",
    "patientResponsibility": "string",
    "paymentStatus": "string",
    "billingNotes": "string"
  }
}

RULES:
- Return ONLY the JSON object
- NO text before or after JSON
- NO emojis or special characters
- NO decorative formatting
- Use "Not provided" for missing information
- systemicExamination and dischargeTreatment must be JSON array strings

Medical Documents:
${formattedPages}`
            }
          ]
        }
      ]
    };

    const response = await bedrockService.invokeBedrockModel(modelId, prompt);

    // Clean the response more aggressively - remove all emojis and decorative characters
    let cleanedResponse = response
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '') // Remove emojis
      .replace(/[═━─│┌┐└┘├┤┬┴┼]/g, '') // Remove box drawing characters
      .replace(/📋|🏥|📝|🩺|📖|🔍|🧪|💊|📊|💉|🔬|📈|📉|⚕️|🚑|🎯|✅|❌|⚠️|🔄|📄|📑|📋|🩹|💉|🔬|🧬|🦠|🩸|💊|🏥|🚑|⚕️/g, '') // Remove all medical and status emojis
      .replace(/[^\x20-\x7E\n\r\t]/g, '') // Remove all non-ASCII characters
      .trim();

    const jsonMatch = cleanedResponse.match(/{.*}/s);
    if (!jsonMatch) {
      throw new Error("Invalid JSON response");
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);

    // Convert complex objects to simple strings for frontend display
    const orderedResponse = { data: {} };
    requiredFields.forEach((field) => {
      const fieldData = parsedResponse.data[field];
      if (fieldData && fieldData.summarizedText) {
        orderedResponse.data[field] = fieldData.summarizedText;
      } else if (typeof fieldData === 'string') {
        orderedResponse.data[field] = fieldData;
      } else {
        orderedResponse.data[field] = "";
      }
    });

    return orderedResponse;
  } catch (error) {
    logger.error(`${logPrefix} :: error :: ${error.message}`);
    throw error;
  }
};