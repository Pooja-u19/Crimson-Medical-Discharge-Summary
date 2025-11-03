@echo off
echo ========================================
echo Deploying Frontend Auto-Refresh Fix
echo ========================================

cd integrated-medical-discharge-app

echo Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Frontend build completed successfully!
echo ========================================
echo.
echo The auto-refresh fix is ready to deploy.
echo.
echo Next steps:
echo 1. Upload the 'dist' folder contents to your web server
echo 2. Or sync with S3 bucket if using S3 hosting:
echo    aws s3 sync dist/ s3://your-bucket-name --delete
echo.
echo Changes included:
echo - Fixed polling mechanism with proper setInterval
echo - Added 30-second auto-refresh background process
echo - Enhanced status dashboard with real-time counters
echo - Improved notifications when processing completes
echo - Better error handling and visual feedback
echo - No backend changes required
echo.
echo The auto-refresh issue should now be resolved!
echo.
pause