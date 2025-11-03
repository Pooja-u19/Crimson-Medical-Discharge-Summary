# Integration with final-summary Stack

This website has been configured to work with the deployed `final-summary` AWS SAM stack.

## Configuration

The following environment variables are configured in `.env`:

- **API Gateway URL**: `https://j0uu01wdqa.execute-api.us-east-1.amazonaws.com/dev/api/v1`
- **Cognito User Pool**: `us-east-1_uiR5I3Ji2`
- **Cognito Client ID**: `3al1vtnltnfd8bn1iniaijn3rk`
- **Documents S3 Bucket**: `final-summary-dev-docs-864981715036-us-east-1`

## How It Works

1. **Document Upload**: When you click "Analyze Document", the file is uploaded to the S3 bucket
2. **Automatic Processing**: S3 EventBridge automatically triggers the OCR Lambda function
3. **OCR Processing**: Textract processes the document and sends results to SNS
4. **Summary Generation**: The summary Lambda function automatically generates a summary using Amazon Bedrock
5. **Status Updates**: The website polls the API to check for processing completion

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Deployment

```bash
# Build the application
npm run build

# Deploy to S3 (run the batch file)
deploy-to-s3.bat
```

## Website URLs

- **Development**: http://localhost:5173
- **Production**: https://d3mtkcp55nx9vt.cloudfront.net

## API Endpoints Used

- `POST /api/v1/document/upload` - Create upload request and get presigned URL
- `GET /api/v1/document/request/{requestId}` - Get document status and summary

## Authentication

The website uses AWS Cognito for user authentication. Users can sign up and sign in to access the document analysis features.

## Automatic Processing Flow

1. User uploads document → S3 bucket
2. S3 EventBridge → SQS → InitiateOCR Lambda
3. InitiateOCR starts Textract job
4. Textract completion → SNS → SQS → GenerateSummary Lambda  
5. GenerateSummary uses Bedrock to create summary
6. Website polls API for status updates
7. User sees completed summary

No manual intervention required - everything is automatic!