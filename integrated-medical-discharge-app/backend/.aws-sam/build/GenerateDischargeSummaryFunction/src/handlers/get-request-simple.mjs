import { randomUUID } from "crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,x-api-key,X-Amz-Security-Token,Accept,Origin,User-Agent,Cache-Control,Pragma',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS,DELETE'
};

export const handler = async (event) => {
  console.log("Simple get request handler triggered");
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const { requestId } = event.pathParameters || {};
    
    if (!requestId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          message: "requestId is required",
          data: null
        })
      };
    }

    // Mock response for testing
    const mockRequest = {
      requestId: requestId,
      patientId: "test-patient-123",
      status: "COMPLETED",
      createdAt: new Date().toISOString()
    };

    const mockDocuments = [{
      documentId: randomUUID(),
      documentStatus: 1, // COMPLETED
      documentType: "other_documents",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      summary: {
        patientName: { summarizedText: "John Doe" },
        age: { summarizedText: "45" },
        gender: { summarizedText: "Male" },
        diagnosis: { summarizedText: "Sample diagnosis for testing" },
        presentingComplaints: { summarizedText: "Sample presenting complaints" },
        pastHistory: { summarizedText: "Sample past medical history" },
        systemicExamination: { summarizedText: "[]" },
        keyInvestigationSummary: { summarizedText: "Sample investigation summary" },
        hospitalCourse: { summarizedText: "Sample hospital course" },
        hospitalizationTreatment: { summarizedText: "Sample treatment" },
        dischargeTreatment: { summarizedText: "[]" },
        advice: { summarizedText: "Sample discharge advice" },
        preventiveCare: { summarizedText: "Sample preventive care" },
        obtainUrgentCare: { summarizedText: "Sample urgent care instructions" }
      },
      pages: ["Sample page 1 content", "Sample page 2 content"]
    }];

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Request retrieved successfully",
        data: {
          request: mockRequest,
          documents: mockDocuments
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