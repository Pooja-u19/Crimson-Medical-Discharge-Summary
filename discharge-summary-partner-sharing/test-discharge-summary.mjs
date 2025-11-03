import { dischargeSummaryService } from './src/services/index.mjs';

// Sample medical documents data for testing
const sampleDocuments = [
  {
    documentId: "doc1",
    documentType: "Laboratory Report",
    pages: [
      `LABORATORY REPORT
      Patient Name: John Smith
      Age: 45 years
      Gender: Male
      IP No: IP2024001
      Admission Date: 2024-01-15
      
      HEMATOLOGY:
      Hemoglobin: 12.5 g/dL (Normal: 13.5-17.5)
      WBC Count: 8,500 /μL (Normal: 4,000-11,000)
      Platelet Count: 250,000 /μL (Normal: 150,000-450,000)
      
      BIOCHEMISTRY:
      SGPT: 45 U/L (Normal: 7-56)
      CRP: 8.2 mg/L (Normal: <3.0)
      
      All values within normal limits except CRP which is slightly elevated.`
    ]
  },
  {
    documentId: "doc2", 
    documentType: "Nursing Report",
    pages: [
      `NURSING ASSESSMENT
      Patient: John Smith
      Date: 2024-01-16
      
      PRESENTING COMPLAINTS:
      - Chest pain for 2 days
      - Shortness of breath
      - Fatigue
      
      VITAL SIGNS:
      BP: 140/90 mmHg
      Pulse: 88 bpm
      Temperature: 98.6°F
      
      PAST HISTORY:
      - Hypertension for 5 years
      - No known allergies
      - Non-smoker
      
      Patient admitted for cardiac evaluation. Stable condition.`
    ]
  },
  {
    documentId: "doc3",
    documentType: "Pharmacy Report", 
    pages: [
      `MEDICATION ADMINISTRATION RECORD
      Patient: John Smith
      Admission: 2024-01-15 to 2024-01-18
      
      MEDICATIONS DURING HOSPITALIZATION:
      - Aspirin 75mg once daily
      - Metoprolol 25mg twice daily
      - Atorvastatin 20mg at bedtime
      
      DISCHARGE MEDICATIONS:
      1. Aspirin 75mg - Once daily - 30 days - Take with food
      2. Metoprolol 25mg - Twice daily - 30 days - Monitor BP
      3. Atorvastatin 20mg - At bedtime - 30 days - Avoid grapefruit
      
      Attending Physician: Dr. Sarah Johnson
      Discharge Date: 2024-01-18`
    ]
  }
];

async function testDischargeSummary() {
  try {
    console.log('🏥 Testing Discharge Summary Generation...\n');
    
    // Generate discharge summary
    const extractedData = await dischargeSummaryService.generateDischargeSummaryFromDocuments(
      sampleDocuments, 
      'PATIENT001'
    );
    
    console.log('📋 Extracted Data:');
    console.log(JSON.stringify(extractedData, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Format the summary
    const formattedSummary = dischargeSummaryService.formatDischargeSummaryTemplate(extractedData);
    
    console.log('📄 FORMATTED DISCHARGE SUMMARY:');
    console.log(formattedSummary);
    
  } catch (error) {
    console.error('❌ Error generating discharge summary:', error.message);
  }
}

// Run the test
testDischargeSummary();