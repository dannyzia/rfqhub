// Test if frontend can reach backend API
const API_BASE_URL = 'http://localhost:3000/api';

async function testBackendConnection() {
  try {
    console.log('Testing backend connection...');
    
    // Test health endpoint
    const healthResponse = await fetch(`${API_BASE_URL}/../health`);
    console.log('Health check status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health check response:', healthData);
    }
    
    // Test register endpoint with minimal data
    const registerData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'vendor',
      companyName: 'Test Company'
    };
    
    console.log('Testing register endpoint...');
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData)
    });
    
    console.log('Register status:', registerResponse.status);
    const registerDataResponse = await registerResponse.json();
    console.log('Register response:', registerDataResponse);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testBackendConnection();
