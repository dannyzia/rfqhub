const http = require('http');

const API_BASE_URL = 'http://localhost:3000';

async function runTests() {
  try {
    console.log('=== Auth Debug Test ===\n');

    // Test 1: Register new user
    console.log('1. Attempting to register test user...');
    const registerRes = await makeRequest('POST', '/api/auth/register', {
      email: 'buyer@test.com',
      password: 'Test@1234',
      firstName: 'Test',
      lastName: 'Buyer',
      role: 'buyer',
      companyName: 'Test Company'
    });

    console.log(`Status: ${registerRes.statusCode}`);
    console.log(`Response: ${JSON.stringify(registerRes.body, null, 2)}\n`);

    if (registerRes.statusCode === 201 || registerRes.statusCode === 200) {
      console.log('✅ Registration successful!\n');
    } else if (registerRes.statusCode === 409 || registerRes.statusCode === 400) {
      console.log('⚠️ Registration failed (user may already exist)\n');
    } else {
      console.log(`❌ Registration failed with status ${registerRes.statusCode}\n`);
    }

    // Test 2: Login with provided credentials
    console.log('2. Attempting to login with test credentials...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'buyer@test.com',
      password: 'test123'
    });

    console.log(`Status: ${loginRes.statusCode}`);
    console.log(`Response: ${JSON.stringify(loginRes.body, null, 2)}\n`);

    if (loginRes.statusCode === 200 || loginRes.statusCode === 201) {
      console.log('✅ Login successful!');
      const token = loginRes.body?.data?.accessToken || loginRes.body?.accessToken;
      console.log(`Token: ${token ? 'RECEIVED' : 'MISSING'}\n`);
    } else {
      console.log(`❌ Login failed with status ${loginRes.statusCode}\n`);
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

function makeRequest(method, path, body = null) {
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

runTests();
