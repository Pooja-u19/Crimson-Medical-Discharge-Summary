@echo off
echo ========================================
echo Testing All API Methods
echo ========================================
echo.

set API_BASE=https://j0uu01wdqa.execute-api.us-east-1.amazonaws.com/dev/api/v1
set ORIGIN=https://d3mtkcp55nx9vt.cloudfront.net

echo 1. Testing OPTIONS /document/upload (CORS Preflight)
echo ----------------------------------------
curl -X OPTIONS "%API_BASE%/document/upload" ^
  -H "Origin: %ORIGIN%" ^
  -H "Access-Control-Request-Method: POST" ^
  -H "Access-Control-Request-Headers: Content-Type" ^
  -v
echo.
echo.

echo 2. Testing POST /document/upload (Create Request)
echo ----------------------------------------
curl -X POST "%API_BASE%/document/upload" ^
  -H "Origin: %ORIGIN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"patientId\":\"test-patient-123\",\"files\":[{\"contentType\":\"application/pdf\",\"size\":1000,\"documentType\":\"other_documents\"}]}" ^
  -v
echo.
echo.

echo 3. Testing GET /document/request/{requestId} (Get Request Status)
echo ----------------------------------------
echo Note: Using a dummy requestId - replace with actual ID from step 2
curl -X GET "%API_BASE%/document/request/dummy-request-id" ^
  -H "Origin: %ORIGIN%" ^
  -v
echo.
echo.

echo 4. Testing GET /discharge-summary/{patientId} (Get Discharge Summary)
echo ----------------------------------------
curl -X GET "%API_BASE%/discharge-summary/test-patient-123" ^
  -H "Origin: %ORIGIN%" ^
  -v
echo.
echo.

echo ========================================
echo API Test Complete
echo ========================================
pause