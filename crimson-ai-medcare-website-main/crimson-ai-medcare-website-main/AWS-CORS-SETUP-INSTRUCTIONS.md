# AWS API Gateway CORS Configuration Instructions

## Overview
This guide explains how to enable CORS on your AWS API Gateway for the Document Summary application.

## Current Configuration
- **API Base URL**: `https://120agbfu0g.execute-api.us-east-1.amazonaws.com/dev`
- **API Key**: `eS0yz4iHrMDqxrewoNrJ9RVcQHfnWvknTvIntE00`
- **Region**: `us-east-1`

## Method 1: Using CloudFormation/SAM (Recommended)

### Prerequisites
- AWS SAM CLI installed
- AWS CLI configured with appropriate credentials

### Steps

1. **Deploy the CloudFormation Stack**
   ```bash
   sam deploy --template-file aws-cloudformation-cors-config.yaml \
     --stack-name document-summary-cors \
     --capabilities CAPABILITY_IAM \
     --region us-east-1
   ```

2. **Verify Deployment**
   ```bash
   aws cloudformation describe-stacks \
     --stack-name document-summary-cors \
     --region us-east-1
   ```

## Method 2: Manual Configuration via AWS Console

### Step 1: Configure API Gateway CORS

1. Navigate to API Gateway Console:
   https://console.aws.amazon.com/apigateway/home?region=us-east-1

2. Select your API (document-summary API)

3. For each resource (/requests, /requests/{requestId}, etc.):
   - Select the resource
   - Click "Actions" → "Enable CORS"
   - Configure:
     - **Access-Control-Allow-Headers**: `Content-Type,Authorization,x-api-key`
     - **Access-Control-Allow-Methods**: `GET,POST,PUT,DELETE,OPTIONS`
     - **Access-Control-Allow-Origin**: `*`
   - Click "Enable CORS and replace existing CORS headers"

4. Click "Actions" → "Deploy API"
   - Select Stage: `dev`
   - Click "Deploy"

### Step 2: Update Lambda Functions

Add CORS headers to all Lambda function responses. Update each Lambda function:

1. **Create Request Function**
   https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/document-summary-dev-create-request

2. **Initiate OCR Function**
   https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/document-summary-dev-initiate-ocr

3. **Generate Summary Function**
   https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/document-summary-dev-generate-summary

4. **Get Request Function**
   https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/document-summary-dev-get-request

For each function, add the CORS response helper from `aws-lambda-cors-response.js`

### Example Lambda Function Update

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,x-api-key',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Your existing Lambda logic here
    const result = { /* your response */ };
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

## Method 3: Using AWS CLI

```bash
# Get your API ID
API_ID=$(aws apigateway get-rest-apis --region us-east-1 \
  --query "items[?name=='document-summary'].id" --output text)

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region us-east-1 \
  --query "items[?path=='/'].id" --output text)

# Enable CORS for each resource
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $ROOT_ID \
  --http-method OPTIONS \
  --authorization-type NONE \
  --region us-east-1

aws apigateway put-method-response \
  --rest-api-id $API_ID \
  --resource-id $ROOT_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters \
    "method.response.header.Access-Control-Allow-Headers=false,\
     method.response.header.Access-Control-Allow-Methods=false,\
     method.response.header.Access-Control-Allow-Origin=false" \
  --region us-east-1

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $ROOT_ID \
  --http-method OPTIONS \
  --type MOCK \
  --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
  --region us-east-1

aws apigateway put-integration-response \
  --rest-api-id $API_ID \
  --resource-id $ROOT_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters \
    "method.response.header.Access-Control-Allow-Headers='Content-Type,Authorization,x-api-key',\
     method.response.header.Access-Control-Allow-Methods='GET,POST,PUT,DELETE,OPTIONS',\
     method.response.header.Access-Control-Allow-Origin='*'" \
  --region us-east-1

# Deploy the API
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name dev \
  --region us-east-1
```

## Testing CORS Configuration

### Test 1: OPTIONS Preflight Request
```bash
curl -X OPTIONS https://120agbfu0g.execute-api.us-east-1.amazonaws.com/dev/requests \
  -H "Origin: https://lovableproject.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,x-api-key" \
  -v
```

Expected response should include:
```
< Access-Control-Allow-Origin: *
< Access-Control-Allow-Headers: Content-Type,Authorization,x-api-key
< Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
```

### Test 2: Actual API Request
```bash
curl -X GET https://120agbfu0g.execute-api.us-east-1.amazonaws.com/dev/requests \
  -H "x-api-key: eS0yz4iHrMDqxrewoNrJ9RVcQHfnWvknTvIntE00" \
  -H "Content-Type: application/json" \
  -v
```

### Test 3: From Lovable Frontend

The Lovable frontend is already configured correctly in `src/lib/aws-api.ts`:
- Includes `mode: 'cors'` in fetch requests
- Sends `x-api-key` header
- Properly handles CORS errors

## Integration with DynamoDB and S3

Your Lambda functions should use:

### DynamoDB Tables
- **Requests Table**: `document-summary-dev-requests`
  https://us-east-1.console.aws.amazon.com/dynamodbv2/home?region=us-east-1#table?name=document-summary-dev-requests

- **Documents Table**: `document-summary-dev-documents`
  https://us-east-1.console.aws.amazon.com/dynamodbv2/home?region=us-east-1#table?name=document-summary-dev-documents

### S3 Bucket
- **Documents Bucket**: `discharge-summary-dev-documents-us-west-2-864981715036`
  https://us-west-2.console.aws.amazon.com/s3/buckets/discharge-summary-dev-documents-us-west-2-864981715036

### Example Lambda Code for DynamoDB/S3 Integration

```javascript
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const REQUESTS_TABLE = 'document-summary-dev-requests';
const DOCUMENTS_TABLE = 'document-summary-dev-documents';
const DOCUMENTS_BUCKET = 'discharge-summary-dev-documents-us-west-2-864981715036';

// Save request to DynamoDB
async function saveRequest(requestData) {
  await dynamodb.put({
    TableName: REQUESTS_TABLE,
    Item: {
      requestId: requestData.requestId,
      fileName: requestData.fileName,
      status: requestData.status,
      createdAt: new Date().toISOString(),
      ...requestData
    }
  }).promise();
}

// Get presigned URL for S3 upload
function getUploadUrl(requestId, fileName) {
  const key = `${requestId}/${fileName}`;
  return s3.getSignedUrl('putObject', {
    Bucket: DOCUMENTS_BUCKET,
    Key: key,
    Expires: 3600,
    ContentType: 'application/pdf'
  });
}
```

## Troubleshooting

### Issue: Still getting CORS errors
1. Verify all Lambda functions return CORS headers
2. Check API Gateway deployment is to the correct stage (dev)
3. Clear browser cache and retry

### Issue: 403 Forbidden
1. Verify API key is being sent in `x-api-key` header
2. Check API key is valid in API Gateway console

### Issue: Network timeout
1. Check Lambda function timeout settings (increase if needed)
2. Verify Lambda has correct IAM permissions for DynamoDB/S3

## Verification Checklist

- [ ] API Gateway CORS enabled for all resources
- [ ] OPTIONS method configured for all endpoints
- [ ] All Lambda functions return CORS headers
- [ ] API deployed to 'dev' stage
- [ ] Lambda functions have correct IAM permissions
- [ ] DynamoDB tables accessible
- [ ] S3 bucket accessible
- [ ] Test requests from Lovable frontend work
- [ ] Browser console shows no CORS errors

## Support Resources

- [AWS API Gateway CORS Documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
- [CloudFormation Stack](https://us-east-1.console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks)
