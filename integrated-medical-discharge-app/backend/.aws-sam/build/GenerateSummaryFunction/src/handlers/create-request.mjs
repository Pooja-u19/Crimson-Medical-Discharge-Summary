import { responseHelper, envHelper } from "../helpers/index.mjs";
import { dynamoDBService } from "../services/index.mjs";
import * as s3Service from "../services/s3Service.mjs";
import { randomUUID } from "crypto";
// Simple console logger for Lambda
const logger = {
  info: (msg) => console.log(`INFO: ${msg}`),
  debug: (msg) => console.log(`DEBUG: ${msg}`),
  warn: (msg) => console.warn(`WARN: ${msg}`),
  error: (msg) => console.error(`ERROR: ${msg}`)
};

const allowedFileTypes = [
  "application/pdf",
  "image/jpeg", 
  "image/png",
  "image/tiff",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];
const maxFileSize = envHelper.getIntEnv("MAX_FILE_SIZE", 10 * 1024 * 1024); // 10MB
const requestsTable = envHelper.getStringEnv("REQUESTS_DYNAMODB_TABLE");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,x-api-key,X-Amz-Security-Token,Accept,Origin,User-Agent,Cache-Control,Pragma',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS,DELETE',
  'Access-Control-Max-Age': '86400'
};

export const handler = async (event) => {
  logger.info("create request lambda triggered");
  logger.debug(`event received :: ${JSON.stringify(event)}`);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    logger.info(`Request body: ${event.body}`);
    const request = JSON.parse(event.body || '{}');
    if (!request || !request.files || request.files.length === 0) {
      logger.warn("at least one document is required");
      const response = responseHelper.clientErrorResponse(
        "at least one document must be uploaded"
      );
      response.headers = { ...response.headers, ...corsHeaders };
      return response;
    }

    // Generate or use provided patient ID
    const patientId = request.patientId || randomUUID();
    logger.info(`Using patientId: ${patientId}`);

    const requiredTypes = ["other_documents"];
    for (const type of requiredTypes) {
      const file = request.files.find((f) => f.documentType === type);

      if (!file) {
        logger.warn(`missing mandatory document type :: ${type}`);
        const response = responseHelper.clientErrorResponse(
          `missing mandatory document: ${type}`
        );
        response.headers = { ...response.headers, ...corsHeaders };
        return response;
      }

      if (!file.documentType) {
        logger.warn(`missing documentType for document :: ${type}`);
        const response = responseHelper.clientErrorResponse(
          `documentType is required for ${type}`
        );
        response.headers = { ...response.headers, ...corsHeaders };
        return response;
      }

      if (!file.contentType) {
        logger.warn(`missing contentType for document type :: ${type}`);
        const response = responseHelper.clientErrorResponse(
          `contentType is required for ${type}`
        );
        response.headers = { ...response.headers, ...corsHeaders };
        return response;
      }

      if (file.size === undefined || file.size === null) {
        logger.warn(`missing size for document type :: ${type}`);
        const response = responseHelper.clientErrorResponse(
          `size is required for ${type}`
        );
        response.headers = { ...response.headers, ...corsHeaders };
        return response;
      }
    }

    const requestId = randomUUID();
    console.log(`🔵 CREATE-REQUEST: Generated requestId = ${requestId}`);
    logger.info(`🔵 CREATE-REQUEST: Generated requestId = ${requestId}`);
    
    const presignedUrls = [];

    for (const documentFile of request.files) {
      const { contentType, size, documentType } = documentFile;

      if (documentType === "other_documents") {
        if (!allowedFileTypes.includes(contentType)) {
          logger.warn(
            `invalid file type for other_documents :: ${contentType}`
          );
          const response = responseHelper.clientErrorResponse(
            `Invalid file type. Allowed types: ${allowedFileTypes.join(', ')}`
          );
          response.headers = { ...response.headers, ...corsHeaders };
          return response;
        }
        if (size > maxFileSize) {
          logger.warn(`other_documents size exceeds the ${maxFileSize / (1024 * 1024)}MB limit`);
          const response = responseHelper.clientErrorResponse(
            `File size must be under ${maxFileSize / (1024 * 1024)}MB.`
          );
          response.headers = { ...response.headers, ...corsHeaders };
          return response;
        }
      } else {
        logger.warn(`invalid document type provided :: ${documentType}`);
        const response = responseHelper.clientErrorResponse(
          "invalid document type. allowed: other_documents."
        );
        response.headers = { ...response.headers, ...corsHeaders };
        return response;
      }

      const documentId = randomUUID();
      console.log(`🟢 CREATE-REQUEST: Generated documentId = ${documentId} for requestId = ${requestId}`);
      logger.info(`🟢 CREATE-REQUEST: Generated documentId = ${documentId} for requestId = ${requestId}`);
      
      const s3Path = `input/${requestId}/${documentType}/${documentId}`;
      console.log(`📁 CREATE-REQUEST: S3 path will be = ${s3Path}`);
      logger.info(`📁 CREATE-REQUEST: S3 path will be = ${s3Path}`);
      
      const presignedUrl = await s3Service.generatePresignedUrl(
        s3Path,
        3600,
        "putObject",
        contentType
      );
      logger.info(`generated presigned url for document :: ${documentId}`);

      presignedUrls.push({
        documentId,
        presignedUrl,
        documentType,
      });
    }

    // Save request to DynamoDB with patient ID
    await dynamoDBService.putItem({
      TableName: requestsTable,
      Item: {
        requestId,
        patientId,
        createdAt: new Date().toISOString(),
        status: "PROCESSING"
      }
    });

    const response = responseHelper.successResponse(
      "documents submission requested successfully",
      {
        presignedUrls,
        requestId,
        patientId,
      }
    );
    
    response.headers = { ...response.headers, ...corsHeaders };
    return response;
  } catch (error) {
    logger.error(`error in upload handler :: ${error.message}`);
    logger.error(`error stack :: ${error.stack}`);
    const response = responseHelper.serverErrorResponse(
      `an error occurred while requesting document submission: ${error.message}`
    );
    response.headers = { ...response.headers, ...corsHeaders };
    return response;
  }
};