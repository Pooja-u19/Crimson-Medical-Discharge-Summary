import { dynamoDBService } from "../services/index.mjs";
import * as s3Service from "../services/s3Service.mjs";
import { envHelper, responseHelper } from "../helpers/index.mjs";
import logger from "../utils/logger.mjs";

const documentsTable = envHelper.getStringEnv("DOCUMENTS_DYNAMODB_TABLE");
const requestsTable = envHelper.getStringEnv("REQUESTS_DYNAMODB_TABLE");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,x-api-key,X-Amz-Security-Token,Accept,Origin,User-Agent,Cache-Control,Pragma',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS,DELETE'
};

export const handler = async (event) => {
  const addCorsHeaders = (response) => ({
    ...response,
    headers: { ...response.headers, ...corsHeaders }
  });

  try {
    logger.info("get request lambda triggered", { event: JSON.stringify(event) });
    
    if (event.httpMethod === 'OPTIONS') {
      return addCorsHeaders({ 
        statusCode: 200, 
        body: JSON.stringify({ message: 'CORS preflight successful' })
      });
    }

    const { requestId } = event.pathParameters || {};
    if (!requestId) {
      logger.warn("missing required parameter :: requestId");
      return addCorsHeaders(responseHelper.clientErrorResponse("requestId is required"));
    }
    const requests = await dynamoDBService.getItem({
      TableName: requestsTable,
      Key: { requestId },
    });

    const request = requests.Item;
    if (!request) {
      logger.warn(`request with requestId :: ${requestId} does not exist`);
      return addCorsHeaders(responseHelper.clientErrorResponse("request does not exist"));
    }

    const documents = await dynamoDBService.query({
      TableName: documentsTable,
      IndexName: "RequestIdIndex",
      KeyConditionExpression: "requestId = :requestId",
      ExpressionAttributeValues: { ":requestId": requestId },
    });

    let results = [];
    if (documents && documents.Items && documents.Items.length > 0) {
      results = await Promise.all(
        documents.Items.map(async (document) => {
          const result = {
            documentId: document.documentId,
            documentStatus: document.documentStatus,
            documentType: document.documentType,
            errorMessage: document.errorMessage || null,
            fraudProbability: document.fraudProbability || null,
            analysisSummary: document.analysisSummary || null,
            summary: document.summary || null,
            pages: document.pages || null,
            createdAt: document.createdAt || null,
            updatedAt: document.updatedAt || null
          };

          if (document.documentS3Path) {
            result.documentS3Path = await s3Service.generatePresignedUrl(
              document.documentS3Path
            );
          }

          if (document.matchedDocumentId) {
            const matchedDocumentResponse = await dynamoDBService.getItem({
              TableName: documentsTable,
              Key: { documentId: document.matchedDocumentId },
            });

            const matchedDocument = matchedDocumentResponse?.Item;
            if (matchedDocument && matchedDocument.documentS3Path) {
              result.matchedDocumentS3Path = await s3Service.generatePresignedUrl(
                matchedDocument.documentS3Path
              );
            }
          }

          return result;
        })
      );
    }

    logger.debug(
      `successfully retrieved document statuses for requestId :: ${requestId} :: results :: ${JSON.stringify(
        results
      )}`
    );
    
    const actions = getAvailableActions(request, results);
    request.actions = actions;
    
    return addCorsHeaders(responseHelper.successResponse("request retrieved successfully", {
      request,
      documents: results,
    }));

  } catch (error) {
    logger.error(`error processing requestId :: ${requestId || 'unknown'} :: ${error.message}`, { 
      error: error.stack,
      event: JSON.stringify(event)
    });
    return addCorsHeaders(responseHelper.serverErrorResponse(
      `an error occurred while retrieving document status: ${error.message}`
    ));
  }
};

const getAvailableActions = (request, documents) => {
  const actions = [];
  
  if (!request) return actions;
  
  if (documents && documents.length > 0) {
    const doc = documents[0];
    
    switch (doc.documentStatus) {
      case 0:
        actions.push({
          type: "info",
          label: "Processing Document",
          description: "Extracting text and generating summary"
        });
        break;
        
      case 1:
        if (doc.summary) {
          actions.push({
            type: "success",
            label: "View Summary",
            description: "Discharge summary is ready",
            documentId: doc.documentId
          });
        } else {
          actions.push({
            type: "info",
            label: "Processing Complete",
            description: "Document processed successfully"
          });
        }
        break;
        
      case 2:
        actions.push({
          type: "warning",
          label: "Duplicate Document",
          description: doc.errorMessage || "Document flagged as duplicate"
        });
        break;
        
      case 3:
        actions.push({
          type: "error",
          label: "Processing Failed",
          description: doc.errorMessage || "Document processing failed"
        });
        break;
    }
  } else {
    const status = request.status || "PENDING";
    
    switch (status) {
      case "PENDING":
        actions.push({
          type: "info",
          label: "Upload in Progress",
          description: "Document is being uploaded"
        });
        break;
        
      case "PROCESSING":
        actions.push({
          type: "info",
          label: "Processing Document",
          description: "Extracting text and generating summary"
        });
        break;
        
      case "COMPLETED":
        actions.push({
          type: "success",
          label: "Processing Complete",
          description: "Document processing completed"
        });
        break;
        
      case "FAILED":
        actions.push({
          type: "error",
          label: "Processing Failed",
          description: "Document processing encountered an error"
        });
        break;
        
      default:
        actions.push({
          type: "info",
          label: "Status Unknown",
          description: `Current status: ${status}`
        });
    }
  }
  
  return actions;
};