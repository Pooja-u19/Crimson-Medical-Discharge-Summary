import { httpStatusCodes } from "../constants/index.mjs";

const createResponse = (statusCode, message, data = null) => {
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      message: message || 'Success',
      data: data || 'null',
    }),
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization,x-api-key,X-Amz-Date,X-Amz-Security-Token",
    },
  };
};

export const successResponse = (message, data = null) => {
  return createResponse(httpStatusCodes.OK, message, data);
};

export const clientErrorResponse = (message, data = null) => {
  return createResponse(httpStatusCodes.BAD_REQUEST, message, data);
};

export const serverErrorResponse = (message, data = null) => {
  return createResponse(httpStatusCodes.INTERNAL_SERVER_ERROR, message, data);
};
