// Fixed API Test Script for final-summary stack
const API_BASE_URL = 'https://j0uu01wdqa.execute-api.us-east-1.amazonaws.com/dev/api/v1';

async function testAPI() {
  console.log('🚀 Testing final-summary API endpoints\n');

  // Test 1: Create Request with proper payload
  console.log('🧪 Test 1: Create Document Request');
  try {
    const createResponse = await fetch(`${API_BASE_URL}/document/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: 'test-discharge-summary.pdf'
      }),
      mode: 'cors'
    });

    console.log(`Status: ${createResponse.status} ${createResponse.statusText}`);
    
    if (createResponse.ok) {
      const data = await createResponse.json();
      console.log('✅ SUCCESS - Create Request');
      console.log('Response:', data);
      
      const { requestId, uploadUrl } = data;
      
      // Test 2: Get Request Status
      console.log('\n🧪 Test 2: Get Request Status');
      const getResponse = await fetch(`${API_BASE_URL}/document/request/${requestId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });
      
      console.log(`Status: ${getResponse.status} ${getResponse.statusText}`);
      if (getResponse.ok) {
        const requestData = await getResponse.json();
        console.log('✅ SUCCESS - Get Request');
        console.log('Response:', requestData);
      } else {
        const error = await getResponse.text();
        console.log('❌ FAIL - Get Request');
        console.log('Error:', error);
      }

      // Test 3: S3 Upload Test
      console.log('\n🧪 Test 3: S3 Upload Test');
      const testFile = new Blob(['Test PDF content for discharge summary'], { type: 'application/pdf' });
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: testFile,
        headers: {
          'Content-Type': 'application/pdf',
        },
        mode: 'cors'
      });
      
      console.log(`Status: ${uploadResponse.status} ${uploadResponse.statusText}`);
      if (uploadResponse.ok) {
        console.log('✅ SUCCESS - S3 Upload');
        
        // Test 4: Check processing status after upload
        console.log('\n🧪 Test 4: Check Processing Status (after 5 seconds)');
        setTimeout(async () => {
          const statusResponse = await fetch(`${API_BASE_URL}/document/request/${requestId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            mode: 'cors'
          });
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('✅ Processing Status Check');
            console.log('Status:', statusData.status);
            console.log('Full Response:', statusData);
          } else {
            console.log('❌ Status check failed');
          }
        }, 5000);
        
      } else {
        const uploadError = await uploadResponse.text();
        console.log('❌ FAIL - S3 Upload');
        console.log('Error:', uploadError);
      }
      
    } else {
      const error = await createResponse.text();
      console.log('❌ FAIL - Create Request');
      console.log('Error:', error);
    }
    
  } catch (error) {
    console.log('❌ NETWORK ERROR');
    console.log('Error:', error.message);
    
    if (error.message.includes('CORS')) {
      console.log('\n🔧 CORS Issue Detected:');
      console.log('- API Gateway needs CORS enabled');
      console.log('- Allow Origin: *');
      console.log('- Allow Headers: content-type, x-api-key, authorization');
      console.log('- Allow Methods: GET, POST, PUT, DELETE, OPTIONS');
    }
  }

  // Test 5: Health Check (if available)
  console.log('\n🧪 Test 5: API Health Check');
  try {
    const healthResponse = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      mode: 'cors'
    });
    
    console.log(`Health Check Status: ${healthResponse.status}`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.text();
      console.log('✅ Health Check OK');
      console.log('Response:', healthData);
    }
  } catch (error) {
    console.log('ℹ️  Health endpoint not available');
  }

  console.log('\n📋 Test Summary:');
  console.log('- API Base URL:', API_BASE_URL);
  console.log('- Stack: final-summary');
  console.log('- Region: us-east-1');
  console.log('\n⏳ Wait 5 seconds for processing status check...');
}

testAPI().catch(console.error);