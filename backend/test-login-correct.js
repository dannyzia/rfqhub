// Test login with correct passwords
const API_BASE_URL = 'http://localhost:3000/api';

// These are the actual passwords that were used to create users
const userCredentials = [
  { email: 'callzr@gmail.com', password: '@DELL123dell#' }, // Correct password
  { email: 'test2@example.com', password: 'TestPassword123!' }, // This was one password
];

console.log('=== Testing with Actual User Credentials ===');

async function testWithCorrectCredentials() {
  for (const user of userCredentials) {
    console.log(`\n=== Testing ${user.email} ===`);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Login successful!`);
      console.log(`📧 User: ${data.data.user.email}`);
      console.log(`👤 Name: ${data.data.user.name}`);
      console.log(`🔑 Roles: ${data.data.user.roles}`);
      console.log(`🏢 Org ID: ${data.data.user.organization_id}`);
      console.log(`🔑 Access Token: ${data.data.accessToken ? 'RECEIVED' : 'MISSING'}`);
      console.log(`🔄 Refresh Token: ${data.data.refreshToken ? 'RECEIVED' : 'MISSING'}`);
      console.log(`📊 Would redirect to: /dashboard`);
      console.log('=====================================');
    } else {
      const errorData = await response.json();
      console.log(`❌ Login failed!`);
      console.log(`📝 Error: ${errorData.error?.message || 'Unknown error'}`);
    }
  }
}

testWithCorrectCredentials();
