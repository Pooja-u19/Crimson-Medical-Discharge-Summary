// Lambda function CORS response helper
// Add this to all your Lambda functions to ensure proper CORS headers

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,x-api-key',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json'
};

// Helper function to create API Gateway response with CORS headers
function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body)
  };
}

// Handle OPTIONS preflight requests
function handleOptions() {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: ''
  };
}

// Example Lambda handler structure
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  try {
    // Your Lambda function logic here
    const result = {
      message: 'Success',
      data: {}
    };

    return createResponse(200, result);
  } catch (error) {
    console.error('Error:', error);
    return createResponse(500, {
      error: error.message
    });
  }
};

// Export helpers for use in other Lambda functions
module.exports = {
  corsHeaders,
  createResponse,
  handleOptions
};
