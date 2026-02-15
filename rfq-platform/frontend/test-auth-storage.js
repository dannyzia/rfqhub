// Test frontend auth token storage
console.log('=== Testing Frontend Auth Token Storage ===');

// Test 1: Check if localStorage is working
try {
  localStorage.setItem('test-token', 'test-access-token');
  const storedToken = localStorage.getItem('test-token');
  console.log(`1. localStorage test token: ${storedToken}`);
} catch (error) {
  console.error('1. localStorage error:', error);
}

// Test 2: Check if browser environment is detected
try {
  const { browser } = require('$app/environment');
  console.log(`2. Browser environment detected: ${browser}`);
} catch (error) {
  console.error('2. Browser environment error:', error);
}

// Test 3: Simulate what happens after login
console.log('3. To test login flow:');
console.log('   - Login with correct credentials');
console.log('   - Check if token is stored in localStorage');
console.log('   - Check if auth store user is updated');
console.log('   - Check if redirect to /dashboard happens');
