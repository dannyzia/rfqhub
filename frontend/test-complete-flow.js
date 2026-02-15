// Test the complete frontend registration flow
const API_BASE_URL = 'http://localhost:3000/api';

console.log('=== Testing Complete Frontend Registration Flow ===');

async function testCompleteFlow() {
  try {
    // Step 1: Test if frontend can reach backend
    console.log('1. Testing backend connectivity...');
    const healthResponse = await fetch(`${API_BASE_URL}/../health`);
    if (healthResponse.ok) {
      console.log('✅ Backend is reachable');
    } else {
      console.log('❌ Backend not reachable');
      return;
    }

    // Step 2: Test /auth/me endpoint (should return 401 for unauthenticated)
    console.log('2. Testing /auth/me endpoint...');
    const meResponse = await fetch(`${API_BASE_URL}/auth/me`);
    if (meResponse.status === 401) {
      console.log('✅ /auth/me endpoint working (returns 401 as expected)');
    } else {
      console.log('❌ /auth/me endpoint not working, status:', meResponse.status);
    }

    // Step 3: Test registration with correct data
    console.log('3. Testing registration...');
    const registrationData = {
      firstName: 'Test',
      lastName: 'User',
      email: `test-flow-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      companyName: 'Test Flow Company',
      role: 'vendor'
    };

    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData)
    });

    if (registerResponse.ok) {
      console.log('✅ Registration successful!');
      const data = await registerResponse.json();
      console.log('📧 User created:', data.data.user.email);
      console.log('🏢 Organization ID:', data.data.user.organization_id);
      
      // Step 4: Simulate frontend redirect behavior
      console.log('4. Frontend would redirect to: /login?registered=true');
      console.log('✅ Complete registration flow working!');
      
    } else {
      const errorData = await registerResponse.json();
      console.log('❌ Registration failed:', errorData.error.message);
      if (errorData.error.details) {
        console.log('🔍 Validation errors:');
        errorData.error.details.forEach(detail => {
          console.log(`   - ${detail.field}: ${detail.message}`);
        });
      }
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

testCompleteFlow();
