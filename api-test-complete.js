const API_BASE = 'https://j0uu01wdqa.execute-api.us-east-1.amazonaws.com/dev/api/v1';
const ORIGIN = 'https://d3mtkcp55nx9vt.cloudfront.net';

async function testAPI() {
    console.log('🧪 Testing All API Methods');
    console.log('=' .repeat(50));

    // Test 1: OPTIONS (CORS Preflight)
    console.log('\n1️⃣ Testing OPTIONS /document/upload');
    try {
        const response = await fetch(`${API_BASE}/document/upload`, {
            method: 'OPTIONS',
            headers: {
                'Origin': ORIGIN,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        });
        console.log(`✅ OPTIONS: ${response.status} ${response.statusText}`);
        console.log('CORS Headers:', {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        });
    } catch (error) {
        console.log(`❌ OPTIONS Error: ${error.message}`);
    }

    // Test 2: POST (Create Request)
    console.log('\n2️⃣ Testing POST /document/upload');
    let requestId = null;
    try {
        const response = await fetch(`${API_BASE}/document/upload`, {
            method: 'POST',
            headers: {
                'Origin': ORIGIN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                patientId: 'test-patient-123',
                files: [{
                    contentType: 'application/pdf',
                    size: 1000,
                    documentType: 'other_documents'
                }]
            })
        });
        
        const data = await response.json();
        console.log(`✅ POST: ${response.status} ${response.statusText}`);
        console.log('Response:', JSON.stringify(data, null, 2));
        
        if (data.data && data.data.requestId) {
            requestId = data.data.requestId;
            console.log(`📝 Request ID: ${requestId}`);
        }
    } catch (error) {
        console.log(`❌ POST Error: ${error.message}`);
    }

    // Test 3: GET Request Status
    if (requestId) {
        console.log('\n3️⃣ Testing GET /document/request/{requestId}');
        try {
            const response = await fetch(`${API_BASE}/document/request/${requestId}`, {
                headers: { 'Origin': ORIGIN }
            });
            const data = await response.json();
            console.log(`✅ GET Request: ${response.status} ${response.statusText}`);
            console.log('Response:', JSON.stringify(data, null, 2));
        } catch (error) {
            console.log(`❌ GET Request Error: ${error.message}`);
        }
    } else {
        console.log('\n3️⃣ ⏭️ Skipping GET request test (no requestId)');
    }

    // Test 4: GET Discharge Summary
    console.log('\n4️⃣ Testing GET /discharge-summary/{patientId}');
    try {
        const response = await fetch(`${API_BASE}/discharge-summary/test-patient-123`, {
            headers: { 'Origin': ORIGIN }
        });
        const data = await response.json();
        console.log(`✅ GET Summary: ${response.status} ${response.statusText}`);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.log(`❌ GET Summary Error: ${error.message}`);
    }

    console.log('\n🎯 API Testing Complete!');
}

// Run the test
testAPI().catch(console.error);