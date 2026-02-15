// Test login for users 1 and 5
const API_BASE_URL = 'http://localhost:3000/api';

console.log('=== Testing Login for User 1 and 5 ===');

async function testLogin(email, password, userNum) {
  try {
    console.log(`\n${userNum}. Testing login for: ${email}`);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Login successful!`);
      console.log(`📧 User email: ${data.data.user.email}`);
      console.log(`👤 User name: ${data.data.user.name}`);
      console.log(`🔑 User roles: ${data.data.user.roles}`);
      console.log(`🏢 Organization ID: ${data.data.user.organization_id}`);
      console.log(`🔑 Access token received: ${data.data.accessToken ? 'YES' : 'NO'}`);
      console.log(`🔄 Refresh token received: ${data.data.refreshToken ? 'YES' : 'NO'}`);
      console.log(`📊 Would redirect to: /dashboard`);
    } else {
      const errorData = await response.json();
      console.log(`❌ Login failed!`);
      console.log(`📝 Error: ${errorData.error.message}`);
      if (errorData.error.details) {
        console.log(`🔍 Field errors:`);
        errorData.error.details.forEach(detail => {
          console.log(`   - ${detail.field}: ${detail.message}`);
        });
      }
    }
    
  } catch (error) {
    console.error(`💥 Network error: ${error.message}`);
  }
}

async function testBothUsers() {
  console.log('\n=== Testing User 1 ===');
  await testLogin('callzr@gmail.com', 'TestPassword123!', '1');
  
  console.log('\n=== Testing User 5 ===');
  await testLogin('test2@example.com', 'TestPassword123!', '5');
}

testBothUsers();
