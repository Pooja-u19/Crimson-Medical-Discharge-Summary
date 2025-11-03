import * as bedrockService from "./bedrockService.mjs";
import { envHelper } from "../helpers/index.mjs";
import logger from "../utils/logger.mjs";

const modelId = envHelper.getStringEnv("BEDROCK_MODEL_ID", "amazon.nova-lite-v1:0");

export const generateDischargeSummaryFromDocuments = async (documents, patientId) => {
  const logPrefix = `generateDischargeSummaryFromDocuments :: patientId :: ${patientId}`;
  
  try {
    // Combine all document pages with document type context
    const documentContents = documents.map((doc, index) => {
      const docType = doc.documentType || 'Medical Document';
      const pages = doc.pages || [];
      const pageContent = pages.join('\n\n');
      return `=== ${docType} ${index + 1} ===\n${pageContent}`;
    }).join('\n\n');

    logger.info(`${logPrefix} :: processing ${documents.length} documents`);

    const prompt = {
      inferenceConfig: {
        maxTokens: 6000,
        temperature: 0.3
      },
      messages: [
        {
          role: "user", 
          content: [{
            text: `You are a medical AI assistant specialized in creating hospital discharge summaries. Your task is to extract and organize medical information from various patient documents (lab reports, nursing notes, pharmacy records, etc.) into a structured discharge summary format. CRITICAL: Never use emojis, decorative characters, or special symbols in any output. Always return valid JSON only, without any additional text or formatting.

Analyze the following medical documents for a single patient and create a comprehensive discharge summary.
            Extract all relevant medical information and organize it according to the structure below.

MEDICAL DOCUMENTS:
${documentContents}

Return the information in this EXACT JSON structure:
{
  "patientInfo": {
    "name": "Patient full name",
    "gender": "Male/Female", 
    "age": "Age in years",
    "ipNo": "Inpatient number",
    "summaryNo": "Generate unique ID like DS-2024-XXXX",
    "admissionDate": "YYYY-MM-DD",
    "dischargeDate": "YYYY-MM-DD",
    "admittingDoctor": "Doctor name"
  },
  "clinicalInfo": {
    "diagnosis": "Primary diagnosis and any secondary diagnoses",
    "presentingComplaints": "Main symptoms that brought patient to hospital",
    "pastHistory": "Relevant past medical history, surgeries, chronic conditions",
    "hospitalCourse": "Summary of what happened during hospital stay, procedures performed, treatment response"
  },
  "investigations": {
    "systemicExamination": [
      {"test": "Hemoglobin", "value": "X.X g/dL", "status": "Normal/Low/High"},
      {"test": "WBC Count", "value": "X,XXX /μL", "status": "Normal/Low/High"},
      {"test": "Platelet Count", "value": "X,XXX /μL", "status": "Normal/Low/High"},
      {"test": "SGPT", "value": "XX U/L", "status": "Normal/Elevated"},
      {"test": "CRP", "value": "X.X mg/L", "status": "Normal/Elevated"}
    ],
    "summary": "Interpretation of key lab findings - mention if values are normal, abnormal, and clinical significance"
  },
  "treatment": {
    "duringHospitalization": "Medications, procedures, interventions given during admission",
    "onDischarge": [
      {
        "drugName": "Medication name",
        "dosage": "Strength/amount", 
        "frequency": "How often",
        "duration": "How long",
        "remarks": "Special instructions"
      }
    ]
  },
  "instructions": {
    "advice": "Post-discharge care instructions, follow-up appointments",
    "preventiveCare": "Lifestyle modifications, diet, exercise recommendations", 
    "urgentCareWarnings": "Symptoms that require immediate medical attention"
  }
}

IMPORTANT GUIDELINES:
- Use "–" for any information not found in the documents
- Extract actual values and dates when available
- For lab values, include units and interpret as Normal/Abnormal
- Generate a unique summary number if not found
- Be comprehensive but concise
- Focus on medically relevant information
- NEVER use emojis, decorative symbols, or special characters
- Return ONLY the JSON object`
          }]
        }
      ]
    };

    const response = await bedrockService.invokeBedrockModel(modelId, prompt);
    
    // Clean and parse response - remove emojis and special characters
    const cleanedResponse = response
      .replace(/```json\s*|\s*```/g, '')
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      .replace(/[^\x20-\x7E\n\r\t]/g, '')
      .trim();

    const jsonMatch = cleanedResponse.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error("Could not extract valid JSON from AI response");
    }

    const extractedData = JSON.parse(jsonMatch[0]);
    return extractedData;

  } catch (error) {
    logger.error(`${logPrefix} :: error :: ${error.message}`);
    throw new Error(`Failed to generate discharge summary: ${error.message}`);
  }
};

export const formatDischargeSummaryTemplate = (data) => {
  try {
    const patientInfo = data.patientInfo || {};
    const clinicalInfo = data.clinicalInfo || {};
    const investigations = data.investigations || {};
    const treatment = data.treatment || {};
    const instructions = data.instructions || {};

    // Format systemic examination table
    const systemicExam = investigations.systemicExamination || [];
    const examTable = systemicExam.length > 0 
      ? systemicExam.map(exam => `${exam.test || 'N/A'}\t${exam.value || 'N/A'}`).join('\n')
      : 'Blood Pressure\tN/A';

    // Format discharge medications table  
    const dischargeMeds = treatment.onDischarge || [];
    const medsTable = dischargeMeds.length > 0
      ? dischargeMeds.map(med => 
          `${med.drugName || 'N/A'}\t${med.dosage || 'N/A'}\t${med.frequency || 'N/A'}\t${med.duration || 'N/A'}\t${med.remarks || 'N/A'}`
        ).join('\n')
      : 'N/A\tN/A\tN/A\tN/A\tN/A';

    // Generate summary number if not provided
    const summaryNo = patientInfo.summaryNo || 
      `DS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;

    return `📄 Discharge Summary

Name: ${patientInfo.name || 'N/A'}

Gender: ${patientInfo.gender || 'N/A'}

Age: ${patientInfo.age || 'N/A'}

Admitting Doctor: ${patientInfo.admittingDoctor || 'N/A'}

IP No: ${patientInfo.ipNo || 'N/A'}

Summary No: ${summaryNo}

Admission Date: ${patientInfo.admissionDate || 'N/A'}

Discharge Date: ${patientInfo.dischargeDate || 'N/A'}

Diagnosis
${clinicalInfo.diagnosis || 'N/A'}

Presenting Complaints
${clinicalInfo.presentingComplaints || 'N/A'}

Past History
${clinicalInfo.pastHistory || 'N/A'}

Systemic Examination
Exam Name\tValue (Admission)
${examTable}

Summary of Key Investigations
${investigations.summary || 'N/A'}

Hospital Course
${clinicalInfo.hospitalCourse || 'N/A'}

Treatment During Hospitalization
${treatment.duringHospitalization || 'N/A'}

Treatment on Discharge
Drug Name\tDosage\tFrequency\tDuration\tRemarks
${medsTable}

Advice
${instructions.advice || 'N/A'}

Preventive Care
${instructions.preventiveCare || 'N/A'}

When to Obtain Urgent Care
${instructions.urgentCareWarnings || 'N/A'}`;

  } catch (error) {
    logger.error(`formatDischargeSummaryTemplate :: error :: ${error.message}`);
    throw new Error(`Failed to format discharge summary: ${error.message}`);
  }
};

export default {
  generateDischargeSummaryFromDocuments,
  formatDischargeSummaryTemplate
};