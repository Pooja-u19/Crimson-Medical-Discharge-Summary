import { envHelper } from "../helpers/index.mjs";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// Simple console logger for Lambda
const logger = {
  info: (msg) => console.log(`INFO: ${msg}`),
  debug: (msg) => console.log(`DEBUG: ${msg}`),
  warn: (msg) => console.warn(`WARN: ${msg}`),
  error: (msg) => console.error(`ERROR: ${msg}`)
};

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const bucketName = envHelper.getStringEnv("DOCUMENTS_S3_BUCKET");
const kmsKeyId = envHelper.getStringEnv("KMS_KEY_ID");
const presignedUrlExpiration = envHelper.getIntEnv(
  "PRESIGNED_URL_EXPIRATION",
  300
);

export const getObject = async (key) => {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  const logPrefix = `s3Service :: getObject :: params :: ${JSON.stringify(
    params
  )}`;
  try {
    logger.info(logPrefix);
    const command = new GetObjectCommand(params);
    const data = await s3Client.send(command);
    logger.debug(`${logPrefix} :: File retrieved successfully`);
    return data;
  } catch (error) {
    logger.error(`${logPrefix} :: error :: ${error.message} :: ${error}`);
    throw error;
  }
};

export const generatePresignedUrl = async (
  key,
  expiresIn = presignedUrlExpiration,
  operation = "getObject",
  contentType = null
) => {
  const params = {
    Bucket: bucketName,
    Key: key,
  };
  
  // Add content type for PUT operations
  if (operation === "putObject" && contentType) {
    params.ContentType = contentType;
  }

  const logPrefix = `s3Service :: generatePresignedUrl :: ${JSON.stringify(
    params
  )} :: operation :: ${operation}`;
  try {
    logger.info(logPrefix);
    
    let command;
    if (operation === "putObject") {
      const { PutObjectCommand } = await import("@aws-sdk/client-s3");
      command = new PutObjectCommand(params);
    } else {
      command = new GetObjectCommand(params);
    }
    
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    logger.debug(`${logPrefix} :: presigned url generated successfully`);
    return presignedUrl;
  } catch (error) {
    logger.error(`${logPrefix} :: error :: ${error.message} :: ${error}`);
    throw error;
  }
};
