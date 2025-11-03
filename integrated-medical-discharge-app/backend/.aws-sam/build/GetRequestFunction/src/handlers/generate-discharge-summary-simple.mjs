const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,x-api-key,X-Amz-Security-Token,Accept,Origin,User-Agent,Cache-Control,Pragma',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS,DELETE'
};

export const handler = async (event) => {
  console.log("Simple generate discharge summary handler triggered");
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const { patientId } = event.pathParameters || {};
    
    if (!patientId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          message: "patientId is required",
          data: null
        })
      };
    }

    // Mock discharge summary for testing
    const mockSummary = {
      patientId: patientId,
      dischargeSummary: {
        patientName: "John Doe",
        age: "45",
        gender: "Male",
        diagnosis: "Sample diagnosis for testing",
        presentingComplaints: "Sample complaints",
        pastHistory: "Sample past history",
        advice: "Sample discharge advice"
      },
      documentsProcessed: 1,
      generatedAt: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Discharge summary generated successfully",
        data: mockSummary
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