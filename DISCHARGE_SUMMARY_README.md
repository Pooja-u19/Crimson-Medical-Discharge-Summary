# Hospital Discharge Summary Generator

This system generates structured hospital discharge summaries from multiple patient documents (laboratory reports, nursing notes, pharmacy records, etc.) using AI-powered document analysis.

## Features

- **Multi-Document Processing**: Combines data from various medical documents for a single patient
- **Structured Format**: Follows standardized discharge summary template
- **AI-Powered Extraction**: Uses AWS Bedrock to intelligently extract medical information
- **Template Formatting**: Outputs professionally formatted discharge summaries
- **Patient Grouping**: Groups documents by patient ID for comprehensive summaries

## Generated Discharge Summary Format

The system generates discharge summaries with the following structure:

```
Discharge Summary

Name: [Patient Name]
Gender: [Gender]
Age: [Age]
IP No.: [IP Number]
Summary No.: [Unique Summary ID]
Admission Date: [Date]
Discharge Date: [Date]
Admitting Doctor: [Doctor Name]

Diagnosis: [Final diagnosis based on all reports]

Presenting Complaints: [List main symptoms or complaints]

Past History: [Mention any relevant history if available]

Systemic Examination:
Exam Name          Value (Admission)
Hemoglobin         [Value]
WBC Count          [Value]
Platelet Count     [Value]
SGPT               [Value]
CRP                [Value]

Summary of Key Investigations:
[Summarize key lab findings with normal/abnormal interpretation]

Hospital Course:
[Summarize hospital stay, investigations done, and treatment provided]

Treatment During Hospitalization:
[List drug names, dosage, and any specific interventions during admission]

Treatment on Discharge:
Drug Name    Dosage    Frequency    Duration    Remarks
[Medications with details]

Advice:
[Add post-discharge advice for the patient]

Preventive Care:
[Mention lifestyle or preventive suggestions]

When to Obtain Urgent Care:
[List warning signs for which the patient should return immediately]
```

## API Endpoints

### Generate Discharge Summary
```
GET /discharge-summary/{patientId}
```

**Parameters:**
- `patientId`: The patient ID to generate summary for

**Response:**
```json
{
  "message": "Discharge summary generated successfully",
  "data": {
    "patientId": "PATIENT001",
    "dischargeSummary": "formatted summary text",
    "documentsProcessed": 3
  }
}
```

## Implementation Files

### Backend Components

1. **Handler**: `src/handlers/generate-discharge-summary.mjs`
   - Main API endpoint handler
   - Handles authentication and request processing
   - Fetches patient documents and generates summary

2. **Service**: `src/services/dischargeSummaryService.mjs`
   - Core business logic for summary generation
   - AI prompt engineering for medical data extraction
   - Template formatting functions

3. **Updated Services Index**: `src/services/index.mjs`
   - Exports the new discharge summary service

### Frontend Components

1. **Viewer Component**: `client/src/components/pages/Admin/RequestsManagement/DischargeSummaryViewer/DischargeSummaryViewer.tsx`
   - React component for displaying discharge summaries
   - Includes download and print functionality
   - Formatted display with proper styling

## Usage Examples

### Testing the Service

Run the test script to see the discharge summary generation in action:

```bash
node test-discharge-summary.mjs
```

### Integration with Existing System

The discharge summary generator integrates with the existing document processing pipeline:

1. Documents are uploaded and processed through OCR
2. All documents for a patient are stored with the same `patientId`
3. When all documents are processed, call the discharge summary endpoint
4. The system combines all document data and generates a comprehensive summary

### Frontend Integration

```typescript
import DischargeSummaryViewer from './DischargeSummaryViewer/DischargeSummaryViewer';

// In your component
const [summaryOpened, setSummaryOpened] = useState(false);
const [selectedPatientId, setSelectedPatientId] = useState('');

// Open discharge summary
const handleViewSummary = (patientId: string) => {
  setSelectedPatientId(patientId);
  setSummaryOpened(true);
};

// Render the viewer
<DischargeSummaryViewer
  opened={summaryOpened}
  onClose={() => setSummaryOpened(false)}
  patientId={selectedPatientId}
  patientName="John Smith"
/>
```

## Key Features

### Intelligent Data Extraction
- Extracts patient demographics from any document type
- Identifies lab values and interprets normal/abnormal ranges
- Combines medication information from multiple sources
- Summarizes clinical course from nursing notes and reports

### Structured Output
- Consistent formatting across all summaries
- Professional medical document appearance
- Tabular data for lab results and medications
- Clear section headings and organization

### Error Handling
- Graceful handling of missing information
- Uses "–" placeholder for unavailable data
- Validates document processing status
- Comprehensive error logging

### Security & Authentication
- Requires user authentication
- Patient data access control
- Secure API endpoints with CORS support

## Configuration

The system uses the following environment variables:

- `DOCUMENTS_DYNAMODB_TABLE`: DynamoDB table for document storage
- `BEDROCK_MODEL_ID`: AWS Bedrock model for AI processing (default: amazon.nova-lite-v1:0)

## Dependencies

### Backend
- AWS SDK for DynamoDB and Bedrock
- Node.js ES modules
- Winston logging

### Frontend  
- React with TypeScript
- Mantine UI components
- Axios for API calls

## Future Enhancements

1. **Template Customization**: Allow different discharge summary templates
2. **Multi-language Support**: Generate summaries in different languages
3. **PDF Generation**: Direct PDF export functionality
4. **Clinical Decision Support**: Add medical recommendations based on data
5. **Integration with EHR**: Direct integration with hospital information systems

## Support

For issues or questions about the discharge summary generator, refer to the main project documentation or contact the development team.