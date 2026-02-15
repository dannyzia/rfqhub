// Test complete login flow with fixed auth middleware
const API_BASE_URL = 'http://localhost:3000/api';

console.log('=== Testing Complete Login Flow (Fixed Auth Middleware) ===');

async function testCompleteFlow() {
  try {
    // Step 1: Test login with vendorabd@gmail.com
    console.log('\n1. Testing login for vendorabd@gmail.com...');
    
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'vendorabd@gmail.com',
        password: '@DELL123dell#'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful!');
      console.log(`📧 User: ${loginData.data.user.email}`);
      console.log(`👤 Name: ${loginData.data.user.name}`);
      console.log(`🔑 Roles: ${loginData.data.user.roles}`);
      console.log(`🏢 Organization ID: ${loginData.data.user.organization_id}`);
      console.log(`🔑 Access Token: ${loginData.data.accessToken ? 'RECEIVED' : 'MISSING'}`);
      console.log(`🔄 Refresh Token: ${loginData.data.refreshToken ? 'RECEIVED' : 'MISSING'}`);
      console.log(`📊 Would redirect to: /dashboard`);
      console.log('=====================================');
      
      // Step 2: Test dashboard access with the token
      console.log('\n2. Testing dashboard access with received token...');
      
      const dashboardResponse = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.data.accessToken}`
        }
      });

      if (dashboardResponse.ok) {
        console.log('✅ Dashboard access successful!');
        const dashboardData = await dashboardResponse.json();
        console.log(`📊 Dashboard data: ${JSON.stringify(dashboardData, null, 2)}`);
      } else {
        console.log('❌ Dashboard access failed!');
        console.log(`📝 Status: ${dashboardResponse.status}`);
      }
      
    } else {
      console.log('❌ Login failed!');
      const errorData = await loginResponse.json();
      console.log(`📝 Error: ${errorData.error?.message || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

testCompleteFlow();
