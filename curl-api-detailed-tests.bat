@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Medical Discharge API - Detailed Tests
echo ========================================
echo Base URL: https://j0uu01wdqa.execute-api.us-east-1.amazonaws.com/dev/api/v1
echo.

set API_BASE=https://j0uu01wdqa.execute-api.us-east-1.amazonaws.com/dev/api/v1

echo TEST 1: CORS Preflight Check
echo =============================
curl -X OPTIONS "%API_BASE%/document/upload" ^
  -H "Access-Control-Request-Method: POST" ^
  -H "Access-Control-Request-Headers: Content-Type,Authorization" ^
  -H "Origin: https://localhost:3000" ^
  -w "\nStatus Code: %%{http_code}\nResponse Time: %%{time_total}s\n" ^
  -s -o cors_response.json
echo Response saved to cors_response.json
echo.

echo TEST 2: Create Document Upload Request
echo ======================================
curl -X POST "%API_BASE%/document/upload" ^
  -H "Content-Type: application/json" ^
  -d "{\"patientId\":\"patient-001\",\"files\":[{\"documentType\":\"medical_record\",\"contentType\":\"application/pdf\",\"size\":2048000}]}" ^
  -w "\nStatus Code: %%{http_code}\nResponse Time: %%{time_total}s\n" ^
  -s -o create_request_response.json
echo Response saved to create_request_response.json
type create_request_response.json
echo.

echo TEST 3: Get Request Status
echo ===========================
echo Using test request ID...
curl -X GET "%API_BASE%/document/request/req-12345-test" ^
  -H "Content-Type: application/json" ^
  -w "\nStatus Code: %%{http_code}\nResponse Time: %%{time_total}s\n" ^
  -s -o get_request_response.json
echo Response saved to get_request_response.json
type get_request_response.json
echo.

echo TEST 4: Generate Discharge Summary
echo ==================================
curl -X GET "%API_BASE%/discharge-summary/patient-001" ^
  -H "Content-Type: application/json" ^
  -w "\nStatus Code: %%{http_code}\nResponse Time: %%{time_total}s\n" ^
  -s -o discharge_summary_response.json
echo Response saved to discharge_summary_response.json
type discharge_summary_response.json
echo.

echo TEST 5: Health Check (Invalid Endpoint)
echo ========================================
curl -X GET "%API_BASE%/health" ^
  -H "Content-Type: application/json" ^
  -w "\nStatus Code: %%{http_code}\nResponse Time: %%{time_total}s\n" ^
  -s -o health_check_response.json
echo Response saved to health_check_response.json
type health_check_response.json
echo.

echo TEST 6: Test with Different Content Types
echo ==========================================
curl -X POST "%API_BASE%/document/upload" ^
  -H "Content-Type: application/json" ^
  -d "{\"patientId\":\"patient-002\",\"files\":[{\"documentType\":\"lab_report\",\"contentType\":\"image/jpeg\",\"size\":1500000},{\"documentType\":\"prescription\",\"contentType\":\"image/png\",\"size\":800000}]}" ^
  -w "\nStatus Code: %%{http_code}\nResponse Time: %%{time_total}s\n" ^
  -s -o multi_file_response.json
echo Response saved to multi_file_response.json
type multi_file_response.json
echo.

echo ========================================
echo All Tests Complete!
echo ========================================
echo Response files created:
echo - cors_response.json
echo - create_request_response.json  
echo - get_request_response.json
echo - discharge_summary_response.json
echo - health_check_response.json
echo - multi_file_response.json
echo.
pause