// Test frontend registration with new user
const API_BASE_URL = 'http://localhost:3000/api';

async function testFrontendRegister() {
  try {
    const registerData = {
      email: `frontendtest${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Frontend',
      lastName: 'Test',
      role: 'vendor',
      companyName: 'Frontend Test Company'
    };
    
    console.log('Testing frontend registration...');
    console.log('Data being sent:', registerData);
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData)
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Registration successful!');
      console.log('User created:', data.data.user.email);
      console.log('Organization ID:', data.data.user.organization_id);
    } else {
      const errorData = await response.json();
      console.log('❌ Registration failed:', errorData.error.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testFrontendRegister();
