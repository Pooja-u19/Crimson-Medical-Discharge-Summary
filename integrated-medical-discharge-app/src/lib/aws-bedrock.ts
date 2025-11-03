// AWS Bedrock Client for AI-powered document summarization
export const BEDROCK_MODEL_ID = "amazon.nova-lite-v1:0";

export interface BedrockPrompt {
  prompt: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
}

export interface BedrockResponse {
  completion: string;
  stop_reason: string;
}

export async function invokeBedrock(
  prompt: string,
  options: Partial<BedrockPrompt> = {}
): Promise<string> {
  const requestPayload = {
    body: JSON.stringify({
      prompt,
      max_tokens: options.max_tokens || 2048,
      temperature: options.temperature || 0.7,
      top_p: options.top_p || 0.9,
    }),
    modelId: BEDROCK_MODEL_ID,
    accept: "application/json",
    contentType: "application/json",
  };

  // This would typically go through a backend Lambda function or edge function
  // since Bedrock requires AWS credentials
  console.log("Bedrock request payload:", requestPayload);
  
  return requestPayload.body;
}

export function createSummaryPrompt(ocrText: string): string {
  return `You are a medical document analyzer. Please analyze the following discharge summary document and provide a concise summary highlighting:

1. Patient information (name, age, admission/discharge dates)
2. Primary diagnosis and secondary diagnoses
3. Key procedures performed
4. Medications prescribed
5. Follow-up instructions
6. Any critical warnings or precautions

Document Text:
${ocrText}

Please provide a structured summary in a clear, professional format.`;
}

export function createAnalysisPrompt(ocrText: string): string {
  return `Analyze this medical discharge summary and extract key clinical information:

${ocrText}

Provide a JSON response with the following structure:
{
  "patient": {
    "name": "",
    "age": "",
    "admissionDate": "",
    "dischargeDate": ""
  },
  "diagnosis": {
    "primary": "",
    "secondary": []
  },
  "procedures": [],
  "medications": [],
  "followUp": "",
  "warnings": []
}`;
}
