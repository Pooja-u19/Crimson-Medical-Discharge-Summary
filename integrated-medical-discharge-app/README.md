# Integrated Medical Discharge Summary Application

This application combines the UI from crimson-ai-medcare-website-main with the backend functionality from discharge-summary-partner-sharing to create a comprehensive medical discharge summary system.

## Features

- **Modern UI**: Clean, responsive interface with authentication
- **Document Upload**: Drag-and-drop file upload with progress tracking
- **AI-Powered Analysis**: Automatic OCR and summary generation using AWS Bedrock
- **Real-time Updates**: Live status updates during document processing
- **Secure Authentication**: AWS Cognito integration for user management
- **Local Storage**: IndexedDB for offline document management
- **CORS Support**: Proper CORS configuration for API Gateway

## Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** components
- **AWS Amplify** for authentication
- **IndexedDB** for local data persistence
- **Vite** for development and building

### Backend
- **AWS Lambda** functions for API endpoints
- **AWS S3** for document storage
- **AWS Textract** for OCR processing
- **AWS Bedrock** for AI summary generation
- **AWS DynamoDB** for metadata storage
- **AWS API Gateway** with CORS enabled
- **AWS EventBridge** for event-driven processing

## Setup Instructions

### 1. Frontend Setup

```bash
cd integrated-medical-discharge-app
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and update with your AWS configuration:

```bash
cp .env.example .env
```

Update the following variables:
- `VITE_AWS_API_BASE_URL`: Your API Gateway URL
- `VITE_AWS_API_KEY`: Your API Gateway API Key (if required)
- `VITE_COGNITO_USER_POOL_ID`: Your Cognito User Pool ID
- `VITE_COGNITO_USER_POOL_CLIENT_ID`: Your Cognito User Pool Client ID

### 3. Backend Deployment

```bash
cd backend
sam build
sam deploy --guided
```

Follow the prompts to configure:
- Stack name: `integrated-medical-discharge-app`
- AWS Region: `us-east-1` (or your preferred region)
- Environment: `dev` or `prod`

### 4. CORS Configuration

After deployment, ensure your API Gateway has CORS enabled:

1. Go to AWS API Gateway Console
2. Select your API
3. For each resource, enable CORS with:
   - Access-Control-Allow-Origin: `*`
   - Access-Control-Allow-Headers: `content-type,x-api-key,authorization`
   - Access-Control-Allow-Methods: `GET,POST,PUT,OPTIONS`

### 5. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

1. **Sign Up/Sign In**: Create an account or sign in with existing credentials
2. **Upload Document**: Select a PDF, DOC, or DOCX file for analysis
3. **Processing**: The system will automatically:
   - Upload the file to S3
   - Trigger OCR processing with Textract
   - Generate AI summary with Bedrock
4. **View Results**: Once processing is complete, view the structured discharge summary

## API Endpoints

- `POST /api/v1/document/upload` - Create upload request and get presigned URL
- `GET /api/v1/document/request/{requestId}` - Get document processing status
- `GET /api/v1/discharge-summary/{patientId}` - Get discharge summary for patient

## File Structure

```
integrated-medical-discharge-app/
├── src/
│   ├── components/ui/          # Reusable UI components
│   ├── contexts/              # React contexts (Auth)
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries (AWS API, IndexedDB)
│   ├── pages/                 # Application pages
│   └── assets/                # Static assets
├── backend/
│   ├── src/                   # Lambda function source code
│   ├── template.yaml          # SAM template for AWS resources
│   └── package.json           # Backend dependencies
├── public/                    # Public assets
└── package.json               # Frontend dependencies
```

## Key Components

### Frontend Components
- **DocumentAnalysis**: Main document upload and analysis interface
- **Auth**: Authentication pages (sign in/sign up)
- **Index**: Landing page with features overview
- **StructuredSummaryDisplay**: Formatted discharge summary viewer

### Backend Services
- **create-request**: Handle document upload requests
- **get-request**: Retrieve document processing status
- **initiate-ocr**: Start OCR processing with Textract
- **generate-summary**: Create AI-powered discharge summaries

## Security Features

- AWS Cognito authentication
- CORS-enabled API Gateway
- Encrypted S3 storage
- KMS encryption for sensitive data
- HIPAA-compliant architecture

## Troubleshooting

### CORS Issues
If you encounter CORS errors:
1. Verify API Gateway CORS configuration
2. Check that all methods have OPTIONS enabled
3. Ensure proper headers are configured

### Authentication Issues
1. Verify Cognito User Pool configuration
2. Check User Pool Client settings
3. Ensure proper environment variables

### Processing Issues
1. Check CloudWatch logs for Lambda functions
2. Verify S3 bucket permissions
3. Ensure Textract and Bedrock are available in your region

## Development

### Adding New Features
1. Frontend changes go in `src/`
2. Backend changes go in `backend/src/`
3. Update `template.yaml` for new AWS resources
4. Test locally with `npm run dev`

### Deployment
```bash
# Frontend
npm run build

# Backend
cd backend
sam build && sam deploy
```

## Support

For issues or questions:
1. Check CloudWatch logs for backend issues
2. Use browser developer tools for frontend debugging
3. Verify AWS resource configurations
4. Check environment variable settings