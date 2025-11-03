# Quick Fix: CORS Configuration for AWS API Gateway

## ⚠️ Current Issue
Your API Gateway at `https://120agbfu0g.execute-api.us-east-1.amazonaws.com/dev` is blocking requests from Lovable due to missing CORS configuration.

## 🚀 Fastest Fix (AWS Console - 5 minutes)

### Step 1: Enable CORS on API Gateway

1. **Go to API Gateway Console**
   - Visit: https://console.aws.amazon.com/apigateway/home?region=us-east-1
   - Find and click your API: `document-summary-dev-api` or similar

2. **Enable CORS for each resource** (`/requests`, `/requests/{requestId}`, `/requests/{requestId}/ocr`, `/requests/{requestId}/summary`):
   - Click on the resource
   - Click "Actions" → "Enable CORS"
   - Set these values:
     - **Access-Control-Allow-Origin**: `*`
     - **Access-Control-Allow-Headers**: `Content-Type,Authorization,x-api-key`
     - **Access-Control-Allow-Methods**: `GET,POST,PUT,DELETE,OPTIONS`
   - Click "Enable CORS and replace existing CORS headers"
   - Confirm by clicking "Yes, replace existing values"

3. **Deploy the API**
   - Click "Actions" → "Deploy API"
   - Select Stage: `dev`
   - Click "Deploy"

### Step 2: Update Lambda Functions to Return CORS Headers

Update EACH of your 4 Lambda functions:

1. **[Create Request Function](https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/document-summary-dev-create-request)**
2. **[Initiate OCR Function](https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/document-summary-dev-initiate-ocr)**
3. **[Generate Summary Function](https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/document-summary-dev-generate-summary)**
4. **[Get Request Function](https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/document-summary-dev-get-request)**

For each function:
- Click the function name
- Replace the handler code with the pattern below
- Click "Deploy"

**Lambda Handler Pattern** (adapt to your existing logic):

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,x-api-key',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));

  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // YOUR EXISTING BUSINESS LOGIC HERE
    // Example:
    // const result = await yourExistingFunction(event);
    
    const result = {
      message: 'Success',
      data: {} // Your actual data
    };

    // ALWAYS return with CORS headers
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error:', error);
    
    // ALWAYS return with CORS headers (even on errors)
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: error.message || 'Internal server error'
      })
    };
  }
};
```

## ✅ Test Your Fix

After completing both steps, test in your browser:

```bash
# Test 1: Check OPTIONS preflight
curl -X OPTIONS https://120agbfu0g.execute-api.us-east-1.amazonaws.com/dev/requests \
  -H "Origin: https://lovableproject.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: content-type,x-api-key" \
  -v

# Test 2: Check actual GET request
curl -X GET https://120agbfu0g.execute-api.us-east-1.amazonaws.com/dev/requests \
  -H "x-api-key: eS0yz4iHrMDqxrewoNrJ9RVcQHfnWvknTvIntE00" \
  -H "Content-Type: application/json" \
  -v
```

**What to look for in the response:**
```
< Access-Control-Allow-Origin: *
< Access-Control-Allow-Headers: Content-Type,Authorization,x-api-key
< Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
```

## 🎯 Alternative: Deploy CloudFormation Template (Recommended for Production)

If you prefer infrastructure-as-code:

```bash
# Using AWS SAM CLI
sam deploy --template-file aws-cloudformation-cors-config.yaml \
  --stack-name document-summary-cors \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

## 🔍 Common Issues

### Still Getting CORS Errors?
1. **Clear browser cache** - Old responses may be cached
2. **Check all 4 Lambda functions** - ALL must return CORS headers
3. **Verify API deployment** - Must deploy to "dev" stage after changes
4. **Check browser console** - Look for specific error messages

### Getting 403 Forbidden?
- Verify API key is correct: `eS0yz4iHrMDqxrewoNrJ9RVcQHfnWvknTvIntE00`
- Check the key is active in API Gateway → API Keys section

### Lambda Timeout?
- Increase timeout in Lambda Configuration → General configuration → Timeout
- Default is 3 seconds, increase to 30 seconds

## 📚 More Information

- Full setup guide: See `AWS-CORS-SETUP-INSTRUCTIONS.md`
- Lambda helper code: See `aws-lambda-cors-response.js`
- CloudFormation template: See `aws-cloudformation-cors-config.yaml`

---

**Need Help?** Check the [AWS CORS Documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)
