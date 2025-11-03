# Deployment Guide - Integrated Medical Discharge Summary App

## Prerequisites

1. **AWS CLI** configured with appropriate permissions
2. **SAM CLI** installed
3. **Node.js** 18+ installed
4. **AWS Account** with permissions for:
   - Lambda, API Gateway, S3, DynamoDB, Textract, Bedrock
   - Cognito, CloudFormation, IAM, KMS

## Step-by-Step Deployment

### 1. Backend Deployment

```bash
cd integrated-medical-discharge-app/backend

# Build the SAM application
sam build

# Deploy with guided setup (first time)
sam deploy --guided

# For subsequent deployments
sam deploy
```

**Guided Setup Parameters:**
- Stack Name: `integrated-medical-discharge-app`
- AWS Region: `us-east-1` (or your preferred region)
- Environment: `dev`
- ProjectName: `medical-discharge`
- SNSSubscriptionEmailsAlerts: `your-email@domain.com` (optional)

### 2. Get Deployment Outputs

After successful deployment, note these outputs:
```bash
sam list stack-outputs --stack-name integrated-medical-discharge-app
```

Key outputs:
- `ApiGatewayURL`: Your API Gateway endpoint
- `CognitoUserPoolId`: User Pool ID for authentication
- `CognitoUserPoolClientId`: User Pool Client ID
- `CloudFrontURL`: Frontend hosting URL (if using CloudFront)

### 3. Configure CORS (Critical Step)

1. Go to AWS API Gateway Console
2. Find your API: `integrated-medical-discharge-app`
3. For each resource (`/document/upload`, `/document/request/{requestId}`):
   - Select the resource
   - Click "Actions" → "Enable CORS"
   - Configure:
     - Access-Control-Allow-Origin: `*`
     - Access-Control-Allow-Headers: `content-type,x-api-key,authorization`
     - Access-Control-Allow-Methods: `GET,POST,PUT,OPTIONS`
   - Click "Enable CORS and replace existing CORS headers"
4. Deploy API: Actions → Deploy API → Select stage → Deploy

### 4. Frontend Configuration

Create `.env` file in the root directory:

```bash
cd integrated-medical-discharge-app
cp .env.example .env
```

Update `.env` with your deployment outputs:
```env
VITE_AWS_REGION=us-east-1
VITE_AWS_API_BASE_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/dev/api/v1
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. Install Dependencies and Run

```bash
npm install
npm run dev
```

### 6. Production Build and Deploy

For production deployment:

```bash
# Build the frontend
npm run build

# Deploy to S3 (if using the S3 bucket from the stack)
aws s3 sync dist/ s3://YOUR_CLIENT_BUCKET_NAME --delete

# Or use the CloudFront distribution URL from the outputs
```

## Testing the Deployment

### 1. Test Authentication
1. Go to your application URL
2. Click "Sign Up" and create an account
3. Check your email for verification code
4. Sign in with your credentials

### 2. Test Document Upload
1. Sign in to the application
2. Go to "Analyze Documents"
3. Upload a PDF file
4. Monitor the processing status
5. View the generated summary

### 3. Test API Endpoints

```bash
# Test create request endpoint
curl -X POST https://YOUR_API_URL/api/v1/document/upload \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "test-patient-123",
    "files": [{
      "documentType": "other_documents",
      "contentType": "application/pdf",
      "size": 1024000
    }]
  }'

# Test get request endpoint
curl https://YOUR_API_URL/api/v1/document/request/REQUEST_ID
```

## Troubleshooting

### Common Issues

#### 1. CORS Errors
**Symptoms:** Browser console shows CORS policy errors
**Solution:**
- Verify API Gateway CORS configuration
- Ensure OPTIONS method is enabled for all resources
- Redeploy the API after CORS changes

#### 2. Authentication Errors
**Symptoms:** Sign up/sign in fails
**Solution:**
- Check Cognito User Pool configuration
- Verify environment variables
- Ensure User Pool Client allows username/password auth

#### 3. File Upload Fails
**Symptoms:** Upload returns 403 or network errors
**Solution:**
- Check S3 bucket CORS configuration
- Verify presigned URL generation
- Check Lambda function logs in CloudWatch

#### 4. Processing Stuck
**Symptoms:** Documents stay in "processing" status
**Solution:**
- Check EventBridge rules are enabled
- Verify SQS queues are receiving messages
- Check Lambda function logs for errors
- Ensure Textract and Bedrock are available in your region

### Monitoring and Logs

1. **CloudWatch Logs:** Check Lambda function logs
   ```bash
   aws logs describe-log-groups --log-group-name-prefix /aws/lambda/integrated-medical-discharge
   ```

2. **API Gateway Logs:** Enable execution logging in API Gateway

3. **S3 Access Logs:** Monitor S3 bucket access

4. **DynamoDB Metrics:** Check table read/write capacity

### Performance Optimization

1. **Lambda Memory:** Adjust memory allocation for summary generation (default: 2048MB)
2. **API Gateway Caching:** Enable caching for GET requests
3. **CloudFront:** Use CloudFront for frontend distribution
4. **DynamoDB:** Monitor and adjust read/write capacity

## Security Considerations

1. **API Keys:** Consider adding API key requirement for production
2. **VPC:** Deploy Lambda functions in VPC for enhanced security
3. **Encryption:** All data is encrypted at rest and in transit
4. **IAM Roles:** Follow principle of least privilege
5. **Cognito:** Configure password policies and MFA

## Cost Optimization

1. **Lambda:** Use ARM-based Graviton2 processors
2. **S3:** Use Intelligent Tiering for document storage
3. **DynamoDB:** Use on-demand billing for variable workloads
4. **CloudWatch:** Set up log retention policies

## Scaling Considerations

1. **Concurrent Processing:** Adjust Lambda concurrency limits
2. **SQS:** Configure dead letter queues and retry policies
3. **API Gateway:** Monitor throttling limits
4. **Bedrock:** Consider model selection for cost vs. quality

## Cleanup

To remove all resources:

```bash
sam delete --stack-name integrated-medical-discharge-app
```

This will delete all AWS resources created by the stack.