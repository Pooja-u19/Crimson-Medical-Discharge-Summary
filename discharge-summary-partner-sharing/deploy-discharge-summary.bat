@echo off
echo Deploying Discharge Summary Generator...

REM Build and deploy the SAM application
sam build --template-file template.yaml
if %errorlevel% neq 0 (
    echo Build failed!
    exit /b 1
)

sam deploy --config-file samconfig.toml --config-env default
if %errorlevel% neq 0 (
    echo Deploy failed!
    exit /b 1
)

echo Deployment completed successfully!
echo.
echo New API endpoint available:
echo GET /api/v1/discharge-summary/{patientId}
echo.
pause