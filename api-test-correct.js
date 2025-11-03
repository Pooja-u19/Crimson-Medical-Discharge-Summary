// Correct API Test Script for final-summary stack
const API_BASE_URL = 'https://j0uu01wdqa.execute-api.us-east-1.amazonaws.com/dev/api/v1';

async function testAPICorrect() {
  console.log('🚀 Testing final-summary API with correct payload format\n');

  // Test 1: Create Request with correct payload structure
  console.log('🧪 Test 1: Create Document Request (Correct Format)');
  
  const requestPayload = {
    patientId: "test-patient-123",
    files: [
      {
        documentType: "other_documents",
        contentType: "application/pdf",
        size: 1024000 // 1MB
      }
    ]
  };

  try {
    const createResponse = await fetch(`${API_BASE_URL}/document/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
      mode: 'cors'
    });

    console.log(`Status: ${createResponse.status} ${createResponse.statusText}`);
    
    if (createResponse.ok) {
      const data = await createResponse.json();
      console.log('✅ SUCCESS - Create Request');
      console.log('Response:', JSON.stringify(data, null, 2));
      
      const { requestId, patientId, presignedUrls } = data.data;
      const uploadUrl = presignedUrls[0]?.presignedUrl;
      
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
        console.log('Response:', JSON.stringify(requestData, null, 2));
      } else {
        const error = await getResponse.text();
        console.log('❌ FAIL - Get Request');
        console.log('Error:', error);
      }

      // Test 3: S3 Upload Test
      if (uploadUrl) {
        console.log('\n🧪 Test 3: S3 Upload Test');
        const testFile = new Blob(['%PDF-1.4\nTest PDF content for discharge summary'], { type: 'application/pdf' });
        
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: testFile,
          headers: {
            'Content-Type': 'application/pdf',
          },
          mode: 'cors'
        });
        
        console.log(`Status: ${uploadResponse.status} ${uploadResponse.statusText}`);
        if (uploadResponse.ok || uploadResponse.status === 200) {
          console.log('✅ SUCCESS - S3 Upload');
          
          // Test 4: Check processing status after upload
          console.log('\n🧪 Test 4: Check Processing Status (after 3 seconds)');
          setTimeout(async () => {
            try {
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
                console.log('Status:', statusData.data?.status || 'Unknown');
                console.log('Full Response:', JSON.stringify(statusData, null, 2));
              } else {
                console.log('❌ Status check failed:', statusResponse.status);
              }
            } catch (error) {
              console.log('❌ Status check error:', error.message);
            }
          }, 3000);
          
        } else {
          const uploadError = await uploadResponse.text();
          console.log('❌ FAIL - S3 Upload');
          console.log('Error:', uploadError);
        }
      } else {
        console.log('⏭️  Skipping S3 upload - no presigned URL');
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
      console.log('\n🔧 CORS Issue Detected');
    }
  }

  // Test 5: CORS Preflight
  console.log('\n🧪 Test 5: CORS Preflight Check');
  try {
    const corsResponse = await fetch(`${API_BASE_URL}/document/upload`, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
      mode: 'cors'
    });
    
    console.log(`CORS Status: ${corsResponse.status}`);
    console.log('CORS Headers:', Object.fromEntries(corsResponse.headers.entries()));
    
    if (corsResponse.ok) {
      console.log('✅ CORS Preflight OK');
    } else {
      console.log('❌ CORS Preflight Failed');
    }
  } catch (error) {
    console.log('❌ CORS Test Error:', error.message);
  }

  console.log('\n📋 API Test Summary:');
  console.log('- API Base URL:', API_BASE_URL);
  console.log('- Stack: final-summary');
  console.log('- Region: us-east-1');
  console.log('- Expected Payload Format: { patientId, files: [{ documentType, contentType, size }] }');
  console.log('\n⏳ Processing status will be checked in 3 seconds...');
}

testAPICorrect().catch(console.error);