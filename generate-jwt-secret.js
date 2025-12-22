#!/usr/bin/env node

/**
 * JWT Secret Generator
 * Generates a secure JWT secret for authentication
 */

const crypto = require('crypto');

// Generate a secure JWT secret
function generateJWTSecret() {
    // Generate 64 bytes of random data and convert to hex
    const secret = crypto.randomBytes(64).toString('hex');
    return secret;
}

// Generate and display the JWT secret
console.log('🔐 JWT Secret Generator');
console.log('='.repeat(50));

const jwtSecret = generateJWTSecret();

console.log('\n✅ Generated JWT Secret:');
console.log(jwtSecret);

console.log('\n📋 Environment Variable:');
console.log(`JWT_SECRET=${jwtSecret}`);

console.log('\n🔧 To use this secret:');
console.log('1. Copy the JWT_SECRET value above');
console.log('2. Add it to your Railway environment variables');
console.log('3. Or create a .env file with: JWT_SECRET=' + jwtSecret);

console.log('\n⚠️  Security Notes:');
console.log('• Keep this secret private and secure');
console.log('• Never commit it to version control');
console.log('• Use different secrets for development and production');
console.log('• Regenerate if you suspect it has been compromised');

console.log('\n🚀 Ready to use with your MongoDB integration!');