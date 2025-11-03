@echo off
echo ========================================
echo Deploying Auto-Refresh Fix
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
echo Build completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Deploy the 'dist' folder to your web server
echo 2. Or copy contents to S3 bucket if using S3 hosting
echo 3. Test the auto-refresh functionality
echo.
echo Changes included:
echo - Fixed polling mechanism
echo - Added auto-refresh every 30s
echo - Enhanced status dashboard
echo - Improved user notifications
echo - Better error handling
echo.
pause