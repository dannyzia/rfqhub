// Test registration without phoneNumber field
const API_BASE_URL = 'http://localhost:3000/api';

const frontendData = {
  firstName: 'Frontend',
  lastName: 'Test',
  email: `frontend-fixed-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  companyName: 'Frontend Test Company',
  role: 'vendor'
  // phoneNumber field removed when empty
};

console.log('=== Fixed Frontend Registration Test ===');
console.log('Data structure:', JSON.stringify(frontendData, null, 2));

async function testFixedRegistration() {
  try {
    console.log('📤 Sending registration request...');
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(frontendData)
    });
    
    console.log('📥 Response status:', response.status);
    
    const data = await response.json();
    console.log('📥 Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ SUCCESS: Registration completed!');
      console.log('👤 User email:', data.data.user.email);
      console.log('🏢 Organization ID:', data.data.user.organization_id);
      console.log('🔑 Access token received');
      console.log('🔄 Refresh token received');
      
      // This is what the frontend should do
      console.log('🔄 Frontend would redirect to: /login?registered=true');
    } else {
      console.log('❌ ERROR: Registration failed');
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
  }
}

testFixedRegistration();
