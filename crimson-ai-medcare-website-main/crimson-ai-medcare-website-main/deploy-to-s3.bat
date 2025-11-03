@echo off
echo Building the React application...
npm run build

echo Uploading to S3 bucket: final-summary-dev-client-864981715036-us-east-1
aws s3 sync dist/ s3://final-summary-dev-client-864981715036-us-east-1 --delete

echo Creating CloudFront invalidation...
aws cloudfront create-invalidation --distribution-id E3JWCC9B5FJJO4 --paths "/*"

echo Deployment complete!
echo Website URL: https://d3mtkcp55nx9vt.cloudfront.net
pause