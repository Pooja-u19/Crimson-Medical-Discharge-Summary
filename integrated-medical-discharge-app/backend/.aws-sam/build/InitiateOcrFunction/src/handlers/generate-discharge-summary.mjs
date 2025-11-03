import { documentStatus } from "../constants/index.mjs";
import { envHelper, responseHelper } from "../helpers/index.mjs";
import { dynamoDBService } from "../services/index.mjs";
import * as dischargeSummaryService from "../services/dischargeSummaryService.mjs";
import logger from "../utils/logger.mjs";


const documentsTable = envHelper.getStringEnv("DOCUMENTS_DYNAMODB_TABLE");
const modelId = envHelper.getStringEnv("BEDROCK_MODEL_ID", "amazon.nova-lite-v1:0");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,x-api-key,X-Amz-Security-Token,Accept,Origin,User-Agent,Cache-Control,Pragma',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS,DELETE'
};

export const handler = async (event) => {
  logger.info("generate discharge summary lambda triggered");
  logger.debug(`event received :: ${JSON.stringify(event)}`);

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  const { patientId } = event.pathParameters || {};
  if (!patientId) {
    logger.warn("missing required parameter :: patientId");
    const response = responseHelper.clientErrorResponse("patientId is required");
    response.headers = { ...response.headers, ...corsHeaders };
    return response;
  }

  try {

    // Get all documents for the patient
    const patientDocuments = await dynamoDBService.query({
      TableName: documentsTable,
      IndexName: "PatientIdIndex",
      KeyConditionExpression: "patientId = :patientId",
      ExpressionAttributeValues: {
        ":patientId": patientId
      }
    });

    if (!patientDocuments.Items || patientDocuments.Items.length === 0) {
      logger.warn(`No documents found for patientId :: ${patientId}`);
      const response = responseHelper.clientErrorResponse("No documents found for this patient");
      response.headers = { ...response.headers, ...corsHeaders };
      return response;
    }

    // Filter processed documents
    const processedDocuments = patientDocuments.Items.filter(
      doc => doc.documentStatus === documentStatus.LEGITIMATE && doc.pages
    );

    if (processedDocuments.length === 0) {
      logger.warn(`No processed documents found for patientId :: ${patientId}`);
      const response = responseHelper.clientErrorResponse("No processed documents found for this patient");
      response.headers = { ...response.headers, ...corsHeaders };
      return response;
    }

    // Generate structured discharge summary
    const extractedData = await dischargeSummaryService.generateDischargeSummaryFromDocuments(processedDocuments, patientId);
    const dischargeSummary = dischargeSummaryService.formatDischargeSummaryTemplate(extractedData);

    const response = responseHelper.successResponse("Discharge summary generated successfully", {
      patientId,
      dischargeSummary,
      documentsProcessed: processedDocuments.length
    });
    
    response.headers = { ...response.headers, ...corsHeaders };
    return response;

  } catch (error) {
    logger.error(`Error generating discharge summary for patientId :: ${patientId} :: error :: ${error.message}`, error);
    const response = responseHelper.serverErrorResponse("An error occurred while generating discharge summary");
    response.headers = { ...response.headers, ...corsHeaders };
    return response;
  }
};

