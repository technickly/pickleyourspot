const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure we're in the right directory
const rootDir = path.resolve(__dirname, '..');
process.chdir(rootDir);

console.log('Generating SSL certificates...');

try {
  // Generate SSL certificate
  execSync(
    'openssl req -x509 -out localhost.pem -keyout localhost-key.pem -newkey rsa:2048 -nodes -sha256 -subj "/CN=localhost" -days 365',
    { stdio: 'inherit' }
  );

  console.log('\nSSL certificates generated successfully!');
  console.log('- localhost.pem');
  console.log('- localhost-key.pem');
} catch (error) {
  console.error('Error generating SSL certificates:', error.message);
  process.exit(1);
} 