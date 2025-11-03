@echo off
echo ========================================
echo Fixing Lambda Dependencies
echo ========================================

cd discharge-summary-partner-sharing

echo 1. Installing dependencies...
echo ==============================
cd src
npm install
cd ..

echo.
echo 2. Building SAM application...
echo ==============================
sam build

echo.
echo 3. Deploying updated functions...
echo =================================
sam deploy --no-confirm-changeset

echo.
echo 4. Testing API after fix...
echo ===========================
timeout /t 10 /nobreak > nul

echo Testing CORS...
curl -X OPTIONS "https://j0uu01wdqa.execute-api.us-east-1.amazonaws.com/dev/api/v1/document/upload" -H "Access-Control-Request-Method: POST" -w "\nStatus: %%{http_code}\n"

echo.
echo Testing Create Request...
curl -X POST "https://j0uu01wdqa.execute-api.us-east-1.amazonaws.com/dev/api/v1/document/upload" -H "Content-Type: application/json" -d "{\"patientId\":\"test-patient-123\",\"files\":[{\"documentType\":\"other_documents\",\"contentType\":\"application/pdf\",\"size\":1024000}]}" -w "\nStatus: %%{http_code}\n"

echo.
echo ========================================
echo Fix Complete!
echo ========================================
pause