@echo off
echo ========================================
echo AWS Lambda Troubleshooting Script
echo ========================================

REM Check if AWS CLI is installed
aws --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: AWS CLI not found. Please install AWS CLI first.
    pause
    exit /b 1
)

echo 1. Checking Lambda Functions...
echo ================================
aws lambda list-functions --query "Functions[?contains(FunctionName, 'discharge-summary')].{Name:FunctionName,Runtime:Runtime,LastModified:LastModified}" --output table

echo.
echo 2. Getting Lambda Function Details...
echo ====================================
aws lambda get-function --function-name discharge-summary-dev-create-request --query "Configuration.{Name:FunctionName,Runtime:Runtime,Timeout:Timeout,MemorySize:MemorySize,Environment:Environment}" --output json > lambda-create-request-config.json
aws lambda get-function --function-name discharge-summary-dev-get-request --query "Configuration.{Name:FunctionName,Runtime:Runtime,Timeout:Timeout,MemorySize:MemorySize,Environment:Environment}" --output json > lambda-get-request-config.json

echo.
echo 3. Checking Recent Lambda Logs...
echo =================================
echo Checking create-request logs...
aws logs describe-log-streams --log-group-name "/aws/lambda/discharge-summary-dev-create-request" --order-by LastEventTime --descending --max-items 1 --query "logStreams[0].logStreamName" --output text > latest-stream.txt
set /p LATEST_STREAM=<latest-stream.txt
aws logs get-log-events --log-group-name "/aws/lambda/discharge-summary-dev-create-request" --log-stream-name "%LATEST_STREAM%" --limit 20 --output json > create-request-logs.json

echo.
echo 4. Checking DynamoDB Tables...
echo ==============================
aws dynamodb list-tables --query "TableNames[?contains(@, 'discharge-summary')]" --output table
aws dynamodb describe-table --table-name discharge-summary-dev-requests --query "Table.{Name:TableName,Status:TableStatus,ItemCount:ItemCount}" --output json > requests-table-info.json
aws dynamodb describe-table --table-name discharge-summary-dev-documents --query "Table.{Name:TableName,Status:TableStatus,ItemCount:ItemCount}" --output json > documents-table-info.json

echo.
echo 5. Checking S3 Buckets...
echo =========================
aws s3 ls | findstr discharge-summary
aws s3api head-bucket --bucket discharge-summary-dev-docs-533267006395-us-east-1 2>nul && echo S3 bucket accessible || echo S3 bucket access denied

echo.
echo 6. Testing Bedrock Model Access...
echo ==================================
aws bedrock list-foundation-models --query "modelSummaries[?contains(modelId, 'nova-lite')].{ModelId:modelId,ModelName:modelName}" --output table

echo.
echo ========================================
echo Troubleshooting Complete
echo ========================================
echo Check the following files for details:
echo - lambda-create-request-config.json
echo - lambda-get-request-config.json  
echo - create-request-logs.json
echo - requests-table-info.json
echo - documents-table-info.json
echo.
pause