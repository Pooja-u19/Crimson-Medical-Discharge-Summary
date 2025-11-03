// Minimal create-request handler for testing
export const handler = async (event) => {
  console.log('Event received:', JSON.stringify(event));
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,x-api-key,X-Amz-Security-Token,Accept,Origin,User-Agent,Cache-Control,Pragma',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS,DELETE',
    'Access-Control-Max-Age': '86400'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const response = {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: "API is working",
        data: {
          requestId: "test-123",
          presignedUrls: [{
            documentId: "doc-123",
            presignedUrl: "https://example.com/upload",
            documentType: "other_documents"
          }],
          patientId: "patient-123"
        }
      })
    };
    
    return response;
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: error.message
      })
    };
  }
};