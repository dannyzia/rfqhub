const bcrypt = require('bcryptjs');

async function generateHashes() {
  const passwords = {
    'admin123': 'admin@rfqbuddy.com',
    'buyer123': 'buyer@rfqbuddy.com', 
    'vendor123': 'vendor@rfqbuddy.com'
  };

  console.log('Generating bcrypt hashes...\n');
  for (const [pass, email] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(pass, 12);
    console.log(`Password: ${pass}`);
    console.log(`Email: ${email}`);
    console.log(`Hash: ${hash}`);
    console.log();
  }
}

generateHashes().catch(console.error);
