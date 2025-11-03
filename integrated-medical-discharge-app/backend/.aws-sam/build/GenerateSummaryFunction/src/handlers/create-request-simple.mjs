import { randomUUID } from "crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,x-api-key,X-Amz-Security-Token,Accept,Origin,User-Agent,Cache-Control,Pragma',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS,DELETE'
};

export const handler = async (event) => {
  console.log("Simple create request handler triggered");
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const request = JSON.parse(event.body || '{}');
    
    if (!request.files || request.files.length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          message: "At least one document is required",
          data: null
        })
      };
    }

    const requestId = randomUUID();
    const patientId = request.patientId || randomUUID();
    
    // Mock presigned URLs for testing
    const presignedUrls = request.files.map(() => ({
      documentId: randomUUID(),
      presignedUrl: "https://example.com/mock-upload-url",
      documentType: "other_documents"
    }));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Documents submission requested successfully",
        data: {
          requestId,
          patientId,
          presignedUrls
        }
      })
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Internal server error",
        data: null
      })
    };
  }
};