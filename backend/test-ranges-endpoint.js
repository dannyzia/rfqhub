const http = require('http');

const API_BASE_URL = 'http://localhost:3000';

async function testEndpoint() {
  try {
    console.log('Testing /api/tender-types/ranges endpoint...\n');

    // First, get a valid token
    console.log('Step 1: Getting auth token...');
    const email = `test-${Date.now()}@test.com`;
    const registerRes = await makeRequest('POST', '/api/auth/register', {
      email,
      password: 'Test@1234',
      firstName: 'Test',
      lastName: 'User',
      role: 'buyer',
      companyName: 'Test Co'
    });

    const token = registerRes.body?.data?.accessToken;
    if (!token) {
      console.log('❌ Failed to get token');
      console.log(JSON.stringify(registerRes.body, null, 2));
      return;
    }
    console.log('✅ Token obtained\n');

    // Now test the endpoint
    console.log('Step 2: Testing GET /api/tender-types/ranges?procurementType=goods');
    const rangesRes = await makeRequest('GET', '/api/tender-types/ranges?procurementType=goods', null, token);

    console.log(`Status: ${rangesRes.statusCode}`);
    console.log(`Response:`);
    console.log(JSON.stringify(rangesRes.body, null, 2));

  } catch (error) {
    console.error('Test error:', error);
  }
}

function makeRequest(method, path, body = null, authToken = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE_URL + path);
    const data = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            body: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: { raw: responseData }
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

testEndpoint();
