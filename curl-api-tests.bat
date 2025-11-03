@echo off
echo ========================================
echo Medical Discharge API - CURL Tests
echo ========================================
echo Base URL: https://j0uu01wdqa.execute-api.us-east-1.amazonaws.com/dev/api/v1
echo.

REM Set API base URL
set API_BASE=https://j0uu01wdqa.execute-api.us-east-1.amazonaws.com/dev/api/v1

echo 1. Testing CORS Preflight (OPTIONS)
echo =====================================
curl -X OPTIONS "%API_BASE%/document/upload" ^
  -H "Access-Control-Request-Method: POST" ^
  -H "Access-Control-Request-Headers: Content-Type" ^
  -H "Origin: http://localhost:3000" ^
  -v
echo.
echo.

echo 2. Testing Create Document Request (POST)
echo ==========================================
curl -X POST "%API_BASE%/document/upload" ^
  -H "Content-Type: application/json" ^
  -d "{\"patientId\":\"test-patient-123\",\"files\":[{\"documentType\":\"other_documents\",\"contentType\":\"application/pdf\",\"size\":1024000}]}" ^
  -v
echo.
echo.

echo 3. Testing Get Request Status (GET)
echo ===================================
echo Note: Replace REQUEST_ID with actual ID from step 2
curl -X GET "%API_BASE%/document/request/test-request-id" ^
  -H "Content-Type: application/json" ^
  -v
echo.
echo.

echo 4. Testing Generate Discharge Summary (GET)
echo ============================================
curl -X GET "%API_BASE%/discharge-summary/test-patient-123" ^
  -H "Content-Type: application/json" ^
  -v
echo.
echo.

echo 5. Testing Invalid Endpoint (404 Test)
echo =======================================
curl -X GET "%API_BASE%/invalid/endpoint" ^
  -H "Content-Type: application/json" ^
  -v
echo.
echo.

echo ========================================
echo Tests Complete
echo ========================================
pause