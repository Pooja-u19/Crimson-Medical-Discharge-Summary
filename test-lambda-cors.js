// Test script to verify Lambda function CORS and functionality
const https = require('https');

const API_URL = 'https://j0uu01wdqa.execute-api.us-east-1.amazonaws.com/dev/api/v1/document/upload';

// Test OPTIONS request (CORS preflight)
function testCORSPreflight() {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://d3mtkcp55nx9vt.cloudfront.net',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    };

    const req = https.request(API_URL, options, (res) => {
      console.log('OPTIONS Response Status:', res.statusCode);
      console.log('OPTIONS Response Headers:', res.headers);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('OPTIONS Response Body:', data);
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', (error) => {
      console.error('OPTIONS Request Error:', error);
      reject(error);
    });

    req.end();
  });
}

// Test POST request
function testPOSTRequest() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      patientId: `test-patient-${Date.now()}`,
      files: [{
        documentType: "other_documents",
        contentType: "application/pdf",
        size: 1024000
      }]
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Origin': 'https://d3mtkcp55nx9vt.cloudfront.net'
      }
    };

    const req = https.request(API_URL, options, (res) => {
      console.log('POST Response Status:', res.statusCode);
      console.log('POST Response Headers:', res.headers);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('POST Response Body:', data);
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', (error) => {
      console.error('POST Request Error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('=== Testing CORS Preflight (OPTIONS) ===');
  try {
    await testCORSPreflight();
  } catch (error) {
    console.error('CORS Preflight failed:', error.message);
  }

  console.log('\n=== Testing POST Request ===');
  try {
    await testPOSTRequest();
  } catch (error) {
    console.error('POST Request failed:', error.message);
  }
}

runTests();