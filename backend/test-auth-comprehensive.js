const http = require('http');

const API_BASE_URL = 'http://localhost:3000';

async function runTests() {
  try {
    console.log('=== Comprehensive Auth Test ===\n');

    // Test 1: Register new user (fresh)
    console.log('1. Registering new user...');
    const email = `buyer-${Date.now()}@test.com`;
    const password = 'Test@1234';
    
    const registerRes = await makeRequest('POST', '/api/auth/register', {
      email,
      password,
      firstName: 'Test',
      lastName: 'Buyer',
      role: 'buyer',
      companyName: 'Test Company'
    });

    console.log(`Status: ${registerRes.statusCode}`);
    const regToken = registerRes.body?.data?.accessToken;
    console.log(`AccessToken received: ${regToken ? 'YES' : 'NO'}\n`);

    if (registerRes.statusCode === 201 && regToken) {
      // Test 2: Use registration token to access protected endpoint
      console.log('2. Testing protected endpoint with registration token...');
      const protectedRes = await makeRequest('GET', '/api/tender-types', null, regToken);
      console.log(`Status: ${protectedRes.statusCode}`);
      console.log(`Response type: ${protectedRes.body?.data ? 'data array' : 'error'}\n`);

      // Test 3: Logout
      console.log('3. Logging out...');
      const logoutRes = await makeRequest('POST', '/api/auth/logout', {
        refreshToken: registerRes.body?.data?.refreshToken
      }, regToken);
      console.log(`Logout Status: ${logoutRes.statusCode}\n`);

      // Test 4: Try to login with same credentials
      console.log('4. Attempting to login with registered email/password...');
      const loginRes = await makeRequest('POST', '/api/auth/login', {
        email,
        password
      });

      console.log(`Status: ${loginRes.statusCode}`);
      if (loginRes.statusCode !== 200 && loginRes.statusCode !== 201) {
        console.log(`Error: ${loginRes.body?.error?.message}`);
        console.log(`Details: ${JSON.stringify(loginRes.body?.error, null, 2)}\n`);
      } else {
        const loginToken = loginRes.body?.data?.accessToken;
        console.log(`Login successful! Token: ${loginToken ? 'YES' : 'NO'}\n`);
      }
    }

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

runTests();
