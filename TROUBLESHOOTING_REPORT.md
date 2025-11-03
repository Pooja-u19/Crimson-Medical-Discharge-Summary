# 🔧 API Troubleshooting Report

## 🚨 **Root Cause Identified**

**Issue**: Lambda functions are failing due to missing `uuid` package dependency

**Error**: `Cannot find package 'uuid' imported from /var/task/src/handlers/create-request.mjs`

## 📊 **Diagnostic Results**

### ✅ **Working Components**
- **AWS CLI**: Configured and accessible
- **Lambda Functions**: 5 functions deployed successfully
- **DynamoDB Tables**: 2 tables active and accessible
  - `medical-discharge-summary-dev-requests`
  - `medical-discharge-summary-dev-documents`
- **S3 Buckets**: 2 buckets accessible
  - `medical-discharge-summary-dev-client-864981715036-us-east-1`
  - `medical-discharge-summary-dev-docs-864981715036-us-east-1`
- **API Gateway**: Deployed and responding (CORS working)

### ❌ **Issues Found**

#### 1. Missing Dependencies
- **Package**: `uuid` not included in Lambda deployment
- **Impact**: All Lambda functions failing with module not found error
- **Functions Affected**: All 5 Lambda functions

#### 2. Environment Variables
- **Status**: ✅ Correctly configured
- **DOCUMENTS_S3_BUCKET**: `medical-discharge-summary-dev-docs-864981715036-us-east-1`
- **REQUESTS_DYNAMODB_TABLE**: `medical-discharge-summary-dev-requests`
- **KMS_KEY_ID**: Properly configured

### 📋 **Lambda Functions Status**
| Function Name | Runtime | Status | Issue |
|---------------|---------|--------|-------|
| `medical-discharge-summary-dev-create-request` | nodejs22.x | ❌ Failed | Missing uuid package |
| `medical-discharge-summary-dev-get-request` | nodejs22.x | ❌ Failed | Missing uuid package |
| `medical-discharge-summary-dev-initiate-ocr` | nodejs22.x | ❌ Failed | Missing uuid package |
| `medical-discharge-summary-dev-generate-summary` | nodejs22.x | ❌ Failed | Missing uuid package |
| `final-summary-dev-generate-discharge-summary` | nodejs22.x | ❌ Failed | Missing uuid package |

## 🛠️ **Fix Required**

### **Update package.json**
Add missing dependencies to `/src/package.json`:

```json
{
  "name": "document-processing-lambdas",
  "version": "1.0.0",
  "description": "Lambda functions for document processing pipeline",
  "dependencies": {
    "@aws-sdk/client-s3": "^3.0.0",
    "@aws-sdk/client-textract": "^3.0.0",
    "@aws-sdk/client-sns": "^3.0.0",
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb": "^3.0.0",
    "@aws-sdk/client-bedrock-runtime": "^3.0.0",
    "@aws-sdk/s3-request-presigner": "^3.0.0",
    "uuid": "^9.0.0",
    "crypto": "^1.0.1"
  }
}
```

### **Redeploy Stack**
```bash
cd discharge-summary-partner-sharing
sam build
sam deploy
```

## 🔍 **Additional Checks Needed**

### 1. Bedrock Model Access
```bash
aws bedrock list-foundation-models --query "modelSummaries[?contains(modelId, 'nova-lite')]" --output table
```

### 2. IAM Permissions
Verify Lambda execution roles have:
- DynamoDB read/write permissions
- S3 read/write permissions  
- Bedrock model invoke permissions
- KMS decrypt permissions

### 3. API Gateway Integration
- Lambda function ARNs correctly configured
- Method integrations properly set up
- CORS headers configured (✅ Working)

## 🚀 **Next Steps**

1. **Immediate Fix**: Update package.json and redeploy
2. **Test API**: Run curl tests after redeployment
3. **Monitor Logs**: Check CloudWatch logs for any remaining issues
4. **Verify Bedrock**: Ensure Nova Lite model access is enabled

## 📈 **Expected Outcome**

After fixing the dependency issue:
- ✅ All Lambda functions should execute successfully
- ✅ API endpoints should return proper responses
- ✅ Document upload and processing pipeline should work end-to-end

**Priority**: 🔴 **HIGH** - Critical dependency missing, blocking all functionality