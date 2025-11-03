# CORS and 502 Error Fix Guide

## Issues Identified

1. **CORS Origin Mismatch**: Lambda response helper was hardcoded to specific CloudFront domain
2. **502 Bad Gateway**: Lambda function runtime errors
3. **Missing CORS Headers**: Incomplete CORS header configuration

## Fixes Applied

### 1. Fixed Response Helper CORS Headers
**File**: `discharge-summary-partner-sharing/src/helpers/responseHelper.mjs`

**Changes**:
- Changed `Access-Control-Allow-Origin` from specific domain to `*`
- Added missing headers: `X-Amz-Date`, `X-Amz-Security-Token`

### 2. Enhanced Lambda Error Handling
**File**: `discharge-summary-partner-sharing/src/handlers/create-request.mjs`

**Changes**:
- Added better request body validation
- Enhanced error logging with stack traces
- Improved OPTIONS request handling
- Added CORS max-age header

## Deployment Steps

1. **Redeploy Lambda Functions**:
   ```bash
   cd discharge-summary-partner-sharing
   sam build
   sam deploy
   ```

2. **Test the API**:
   ```bash
   node test-lambda-cors.js
   ```

3. **Verify CORS in Browser**:
   - Open browser developer tools
   - Check Network tab for CORS headers
   - Verify OPTIONS preflight requests succeed

## Additional Troubleshooting

### If 502 Errors Persist:

1. **Check CloudWatch Logs**:
   ```bash
   aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/discharge-summary"
   aws logs tail /aws/lambda/discharge-summary-dev-create-request --follow
   ```

2. **Verify Environment Variables**:
   - `DOCUMENTS_S3_BUCKET`
   - `REQUESTS_DYNAMODB_TABLE`
   - `KMS_KEY_ID`

3. **Check IAM Permissions**:
   - Lambda execution role has S3 and DynamoDB permissions
   - KMS key permissions for encryption/decryption

### If CORS Issues Persist:

1. **Update API Gateway CORS**:
   - Ensure API Gateway has proper CORS configuration
   - Redeploy API Gateway stage

2. **Check CloudFront Settings**:
   - Verify CloudFront forwards necessary headers
   - Check cache behaviors

## Testing Commands

```bash
# Test OPTIONS request
curl -X OPTIONS \
  -H "Origin: https://d3mtkcp55nx9vt.cloudfront.net" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v https://j0uu01wdqa.execute-api.us-east-1.amazonaws.com/dev/api/v1/document/upload

# Test POST request
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://d3mtkcp55nx9vt.cloudfront.net" \
  -d '{"patientId":"test-123","files":[{"documentType":"other_documents","contentType":"application/pdf","size":1024000}]}' \
  -v https://j0uu01wdqa.execute-api.us-east-1.amazonaws.com/dev/api/v1/document/upload
```

## Expected Results

After fixes:
- OPTIONS requests should return 200 with proper CORS headers
- POST requests should return 200 with presigned URLs
- No more CORS policy errors in browser console
- No more 502 Bad Gateway errors