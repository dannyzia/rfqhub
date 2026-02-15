// Simulate exact frontend registration flow
const API_BASE_URL = 'http://localhost:3000/api';

// Simulate the exact data structure from frontend
const frontendData = {
  firstName: 'Frontend',
  lastName: 'Test',
  email: `frontend-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  companyName: 'Frontend Test Company',
  phoneNumber: '',
  role: 'vendor' // This is the fixed value
};

console.log('=== Frontend Registration Simulation ===');
console.log('Data structure:', JSON.stringify(frontendData, null, 2));

async function simulateFrontendRegistration() {
  try {
    console.log('📤 Sending registration request...');
    
    // Simulate exact fetch call from frontend
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: Frontend doesn't send Authorization header for registration
      },
      body: JSON.stringify(frontendData)
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers));
    
    const data = await response.json();
    console.log('📥 Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ SUCCESS: Registration completed');
      console.log('👤 User email:', data.data.user.email);
      console.log('🏢 Organization ID:', data.data.user.organization_id);
      console.log('🔑 Access token length:', data.data.accessToken.length);
      console.log('🔄 Refresh token:', data.data.refreshToken);
      
      // Simulate frontend redirect
      console.log('🔄 Would redirect to: /login?registered=true');
    } else {
      console.log('❌ ERROR: Registration failed');
      console.log('📝 Error details:', data.error);
      
      // Simulate frontend error handling
      if (data.error.details) {
        console.log('🔍 Field errors:');
        data.error.details.forEach((detail, index) => {
          console.log(`   ${index + 1}. ${detail.field}: ${detail.message}`);
        });
      } else {
        console.log('📝 General error:', data.error.message);
      }
    }
    
  } catch (error) {
    console.error('💥 NETWORK ERROR:', error.message);
    console.log('🔍 This would be caught by frontend try-catch');
  }
}

simulateFrontendRegistration();
