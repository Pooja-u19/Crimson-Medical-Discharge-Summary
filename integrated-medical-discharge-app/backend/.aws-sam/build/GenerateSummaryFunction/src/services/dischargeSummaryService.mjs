import * as bedrockService from "./bedrockService.mjs";
import { envHelper } from "../helpers/index.mjs";
import logger from "../utils/logger.mjs";

const modelId = envHelper.getStringEnv("BEDROCK_MODEL_ID", "amazon.nova-lite-v1:0");

export const generateDischargeSummaryFromDocuments = async (documents, patientId) => {
  const logPrefix = `generateDischargeSummaryFromDocuments :: patientId :: ${patientId}`;
  
  try {
    // Check if documents have summary data from the generate-summary handler
    const documentsWithSummary = documents.filter(doc => doc.summary && doc.summary.data);
    
    if (documentsWithSummary.length > 0) {
      // Use existing processed summary data
      logger.info(`${logPrefix} :: using existing processed summary data from ${documentsWithSummary.length} documents`);
      logger.info(`${logPrefix} :: summary data structure: ${JSON.stringify(documentsWithSummary[0].summary, null, 2)}`);
      return convertSummaryDataToDischargeFormat(documentsWithSummary[0].summary.data);
    }

    // Fallback: Process raw document pages if no summary exists
    const documentContents = documents.map((doc, index) => {
      const docType = doc.documentType || 'Medical Document';
      const pages = doc.pages || [];
      const pageContent = pages.join('\n\n');
      return `=== ${docType} ${index + 1} ===\n${pageContent}`;
    }).join('\n\n');

    logger.info(`${logPrefix} :: processing ${documents.length} documents from raw pages`);

    const prompt = {
      inferenceConfig: {
        maxTokens: 6000,
        temperature: 0.3
      },
      messages: [
        {
          role: "system",
          content: [{
            text: `You are a medical AI assistant specialized in creating hospital discharge summaries. 
            Your task is to extract and organize medical information from various patient documents 
            (lab reports, nursing notes, pharmacy records, etc.) into a structured discharge summary format.
            
            CRITICAL: Never use emojis, decorative characters, or special symbols in any output. 
            Always return valid JSON only, without any additional text or formatting.`
          }]
        },
        {
          role: "user", 
          content: [{
            text: `Analyze the following medical documents for a single patient and create a comprehensive discharge summary.
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

// Convert the summary data format from generate-summary to discharge summary format
const convertSummaryDataToDischargeFormat = (summaryData) => {
  try {
    logger.info(`Converting summary data: ${JSON.stringify(summaryData, null, 2)}`);
    
    // Parse systemic examination if it's a JSON string
    let systemicExamination = [];
    if (summaryData.systemicExamination && summaryData.systemicExamination.summarizedText) {
      try {
        const examText = summaryData.systemicExamination.summarizedText;
        logger.info(`Processing systemic examination: ${examText}`);
        
        // Try to parse as JSON array first
        if (examText.trim().startsWith('[')) {
          const examData = JSON.parse(examText);
          systemicExamination = Array.isArray(examData) ? examData.map(exam => ({
            test: exam.label || exam.test || exam.name || 'Unknown Test',
            value: exam.admission || exam.value || exam.result || '--',
            status: exam.status || 'Recorded'
          })) : [];
        } else {
          // If not JSON, treat as plain text and create a single entry
          systemicExamination = [{
            test: 'Clinical Examination',
            value: examText,
            status: 'Recorded'
          }];
        }
      } catch (e) {
        logger.warn(`Failed to parse systemic examination: ${e.message}`);
        systemicExamination = [{
          test: 'Clinical Examination',
          value: summaryData.systemicExamination.summarizedText || '--',
          status: 'Recorded'
        }];
      }
    }

    // Parse discharge treatment if it's a JSON string
    let dischargeTreatment = [];
    if (summaryData.dischargeTreatment && summaryData.dischargeTreatment.summarizedText) {
      try {
        const treatmentText = summaryData.dischargeTreatment.summarizedText;
        logger.info(`Processing discharge treatment: ${treatmentText}`);
        
        // Try to parse as JSON array first
        if (treatmentText.trim().startsWith('[')) {
          const treatmentData = JSON.parse(treatmentText);
          dischargeTreatment = Array.isArray(treatmentData) ? treatmentData.map(med => ({
            drugName: med.drugName || med.name || '--',
            dosage: med.dosage || med.dose || '--',
            frequency: med.frequency || '--',
            duration: med.numberOfDays ? `${med.numberOfDays} days` : (med.duration || '--'),
            remarks: med.remark || med.remarks || med.instructions || '--'
          })) : [];
        } else {
          // If not JSON, treat as plain text
          dischargeTreatment = [{
            drugName: 'As per prescription',
            dosage: '--',
            frequency: '--',
            duration: '--',
            remarks: treatmentText
          }];
        }
      } catch (e) {
        logger.warn(`Failed to parse discharge treatment: ${e.message}`);
        dischargeTreatment = [{
          drugName: 'As per prescription',
          dosage: '--',
          frequency: '--',
          duration: '--',
          remarks: summaryData.dischargeTreatment.summarizedText || '--'
        }];
      }
    }

    const result = {
      patientInfo: {
        name: summaryData.patientName?.summarizedText || '--',
        gender: summaryData.gender?.summarizedText || '--',
        age: summaryData.age?.summarizedText || '--',
        ipNo: summaryData.ipNo?.summarizedText || '--',
        summaryNo: summaryData.summaryNumber?.summarizedText || `DS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
        admissionDate: summaryData.admissionDate?.summarizedText || '--',
        dischargeDate: summaryData.dischargeDate?.summarizedText || '--',
        admittingDoctor: summaryData.admittingDoctor?.summarizedText || '--'
      },
      clinicalInfo: {
        diagnosis: summaryData.diagnosis?.summarizedText || '--',
        presentingComplaints: summaryData.presentingComplaints?.summarizedText || '--',
        pastHistory: summaryData.pastHistory?.summarizedText || '--',
        hospitalCourse: summaryData.hospitalCourse?.summarizedText || '--'
      },
      investigations: {
        systemicExamination: systemicExamination,
        summary: summaryData.keyInvestigationSummary?.summarizedText || '--'
      },
      treatment: {
        duringHospitalization: summaryData.hospitalizationTreatment?.summarizedText || '--',
        onDischarge: dischargeTreatment
      },
      instructions: {
        advice: summaryData.advice?.summarizedText || '--',
        preventiveCare: summaryData.preventiveCare?.summarizedText || '--',
        urgentCareWarnings: summaryData.obtainUrgentCare?.summarizedText || '--'
      }
    };
    
    logger.info(`Converted result: ${JSON.stringify(result, null, 2)}`);
    return result;
    
  } catch (error) {
    logger.error(`convertSummaryDataToDischargeFormat :: error :: ${error.message}`);
    throw new Error(`Failed to convert summary data: ${error.message}`);
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
      ? systemicExam.map(exam => `${exam.test || '--'}\t${exam.value || '--'}`).join('\n')
      : 'No examination data available';

    // Format discharge medications table  
    const dischargeMeds = treatment.onDischarge || [];
    const medsTable = dischargeMeds.length > 0
      ? dischargeMeds.map(med => 
          `${med.drugName || '--'}\t${med.dosage || '--'}\t${med.frequency || '--'}\t${med.duration || '--'}\t${med.remarks || '--'}`
        ).join('\n')
      : 'No discharge medications recorded';

    // Generate summary number if not provided
    const summaryNo = patientInfo.summaryNo || 
      `DS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;

    return `DISCHARGE SUMMARY

Name: ${patientInfo.name || '--'}

Gender: ${patientInfo.gender || '--'}

Age: ${patientInfo.age || '--'}

Admitting Doctor: ${patientInfo.admittingDoctor || '--'}

IP No: ${patientInfo.ipNo || '--'}

Summary No: ${summaryNo}

Admission Date: ${patientInfo.admissionDate || '--'}

Discharge Date: ${patientInfo.dischargeDate || '--'}

Diagnosis
${clinicalInfo.diagnosis || 'No diagnosis information available'}

Presenting Complaints
${clinicalInfo.presentingComplaints || 'No presenting complaints recorded'}

Past History
${clinicalInfo.pastHistory || 'No past history available'}

Systemic Examination
Exam Name\tValue (Admission)
${examTable}

Summary of Key Investigations
${investigations.summary || 'No investigation summary available'}

Hospital Course
${clinicalInfo.hospitalCourse || 'No hospital course information available'}

Treatment During Hospitalization
${treatment.duringHospitalization || 'No hospitalization treatment information available'}

Treatment on Discharge
Drug Name\tDosage\tFrequency\tDuration\tRemarks
${medsTable}

Advice
${instructions.advice || 'No specific advice provided'}

Preventive Care
${instructions.preventiveCare || 'No preventive care instructions provided'}

When to Obtain Urgent Care
${instructions.urgentCareWarnings || 'No urgent care warnings specified'}`;

  } catch (error) {
    logger.error(`formatDischargeSummaryTemplate :: error :: ${error.message}`);
    throw new Error(`Failed to format discharge summary: ${error.message}`);
  }
};

export default {
  generateDischargeSummaryFromDocuments,
  formatDischargeSummaryTemplate
};