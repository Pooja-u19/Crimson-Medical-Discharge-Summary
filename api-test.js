// API Test Script for final-summary stack
const API_BASE_URL = 'https://j0uu01wdqa.execute-api.us-east-1.amazonaws.com/dev/api/v1';

class APITester {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.testResults = [];
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        mode: 'cors',
      });

      const responseData = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      };

      if (response.ok) {
        try {
          responseData.data = await response.json();
        } catch {
          responseData.data = await response.text();
        }
      } else {
        responseData.error = await response.text();
      }

      return responseData;
    } catch (error) {
      return {
        status: 0,
        error: error.message,
        type: 'NetworkError'
      };
    }
  }

  log(test, result) {
    const status = result.status >= 200 && result.status < 300 ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
    console.log(`   Status: ${result.status} ${result.statusText || ''}`);
    if (result.data) console.log(`   Response:`, result.data);
    if (result.error) console.log(`   Error:`, result.error);
    console.log('');
    
    this.testResults.push({ test, status: result.status, ...result });
  }

  async testCreateRequest() {
    console.log('🧪 Testing CREATE REQUEST...');
    const result = await this.request('/document/upload', {
      method: 'POST',
      body: JSON.stringify({ fileName: 'test-document.pdf' }),
    });
    this.log('POST /document/upload', result);
    return result.data?.requestId;
  }

  async testGetRequest(requestId) {
    console.log('🧪 Testing GET REQUEST...');
    const result = await this.request(`/document/request/${requestId || 'test-id'}`);
    this.log(`GET /document/request/${requestId || 'test-id'}`, result);
    return result;
  }

  async testUploadToS3(uploadUrl) {
    if (!uploadUrl) {
      console.log('⏭️  Skipping S3 upload test - no upload URL');
      return;
    }

    console.log('🧪 Testing S3 UPLOAD...');
    const testFile = new Blob(['Test PDF content'], { type: 'application/pdf' });
    
    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: testFile,
        headers: {
          'Content-Type': 'application/pdf',
        },
        mode: 'cors',
      });

      const result = {
        status: response.status,
        statusText: response.statusText,
      };

      this.log('PUT S3 Upload', result);
      return result;
    } catch (error) {
      this.log('PUT S3 Upload', { status: 0, error: error.message });
    }
  }

  async testCORSPreflight() {
    console.log('🧪 Testing CORS PREFLIGHT...');
    const result = await this.request('/document/upload', {
      method: 'OPTIONS',
    });
    this.log('OPTIONS /document/upload (CORS)', result);
    return result;
  }

  async testInvalidEndpoint() {
    console.log('🧪 Testing INVALID ENDPOINT...');
    const result = await this.request('/invalid/endpoint');
    this.log('GET /invalid/endpoint', result);
    return result;
  }

  async runAllTests() {
    console.log('🚀 Starting API Tests for final-summary stack\n');
    console.log(`Base URL: ${this.baseUrl}\n`);

    // Test 1: CORS Preflight
    await this.testCORSPreflight();

    // Test 2: Create Request
    const requestId = await this.testCreateRequest();
    const uploadUrl = this.testResults[this.testResults.length - 1]?.data?.uploadUrl;

    // Test 3: Get Request (with real ID if available)
    await this.testGetRequest(requestId);

    // Test 4: S3 Upload (if upload URL available)
    if (uploadUrl) {
      await this.testUploadToS3(uploadUrl);
    }

    // Test 5: Invalid endpoint
    await this.testInvalidEndpoint();

    // Summary
    this.printSummary();
  }

  printSummary() {
    console.log('📊 TEST SUMMARY');
    console.log('================');
    
    const passed = this.testResults.filter(r => r.status >= 200 && r.status < 300).length;
    const failed = this.testResults.filter(r => r.status < 200 || r.status >= 300).length;
    
    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => r.status < 200 || r.status >= 300)
        .forEach(r => console.log(`   - ${r.test}: ${r.status} ${r.error || r.statusText}`));
    }

    console.log('\n🔧 Common Issues & Solutions:');
    console.log('- CORS errors: Enable CORS in API Gateway');
    console.log('- 403 errors: Check API key or authentication');
    console.log('- 404 errors: Verify endpoint URLs and deployment');
    console.log('- Network errors: Check internet connection and firewall');
  }
}

// Run tests
const tester = new APITester();
tester.runAllTests().catch(console.error);