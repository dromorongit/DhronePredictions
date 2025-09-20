#!/usr/bin/env node

/**
 * Test Script for Telegram Bot
 *
 * Usage:
 * node test-bot.js
 *
 * This script tests the bot's code validation logic without running the actual bot
 */

const { generateCode, generateUniqueCodes, loadExistingCodes } = require('./generate-codes');

// Test code generation
function testCodeGeneration() {
  console.log('🧪 Testing Code Generation...\n');

  // Test single code generation
  const code = generateCode();
  console.log(`Generated code: ${code}`);
  console.log(`Code length: ${code.length}`);
  console.log(`Is numeric: ${/^\d+$/.test(code)}`);
  console.log(`Is 7 digits: ${code.length === 7}\n`);

  // Test multiple code generation
  const codes = generateUniqueCodes(5);
  console.log(`Generated 5 unique codes:`);
  codes.forEach((code, index) => {
    console.log(`  ${index + 1}. ${code}`);
  });

  // Check uniqueness
  const uniqueCodes = new Set(codes);
  console.log(`All codes unique: ${uniqueCodes.size === codes.length}\n`);
}

// Test code validation logic (simulating bot logic)
function testCodeValidation() {
  console.log('🔍 Testing Code Validation Logic...\n');

  // Sample valid codes
  const validCodes = new Set(['1234567', '7654321', '1111111']);
  const usedCodes = new Set(['1234567']); // Simulate used code

  const testCodes = ['7654321', '1111111', '9999999', '1234567', 'invalid'];

  testCodes.forEach(code => {
    let status = '❌ Invalid';

    if (!/^\d{7}$/.test(code)) {
      status = '❌ Not 7 digits';
    } else if (!validCodes.has(code)) {
      status = '❌ Not in valid codes';
    } else if (usedCodes.has(code)) {
      status = '❌ Already used';
    } else {
      status = '✅ Valid and available';
    }

    console.log(`Code: ${code} - ${status}`);
  });

  console.log();
}

// Test plan determination logic
function testPlanDetermination() {
  console.log('📊 Testing Plan Determination...\n');

  const testCodes = ['1234567', '4567890', '7890123', '0123456'];

  testCodes.forEach(code => {
    const firstDigit = parseInt(code.charAt(0));
    let plan = 'unknown';

    if (firstDigit <= 3) plan = 'daily';
    else if (firstDigit <= 6) plan = 'monthly';
    else plan = 'yearly';

    console.log(`Code: ${code} (starts with ${firstDigit}) → ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`);
  });

  console.log();
}

// Test existing code loading
function testExistingCodeLoading() {
  console.log('📂 Testing Existing Code Loading...\n');

  try {
    const existingCodes = loadExistingCodes();
    console.log(`Found ${existingCodes.size} existing codes in telegram-bot.js`);

    if (existingCodes.size > 0) {
      console.log('Sample codes:');
      Array.from(existingCodes).slice(0, 5).forEach((code, index) => {
        console.log(`  ${index + 1}. ${code}`);
      });

      if (existingCodes.size > 5) {
        console.log(`  ... and ${existingCodes.size - 5} more`);
      }
    }
  } catch (error) {
    console.log(`Could not load existing codes: ${error.message}`);
  }

  console.log();
}

// Simulate user flow
function simulateUserFlow() {
  console.log('🎭 Simulating User Flow...\n');

  // Step 1: Generate access code
  const accessCode = generateCode();
  console.log(`1. User pays → Gets access code: ${accessCode}`);

  // Step 2: Determine plan
  const firstDigit = parseInt(accessCode.charAt(0));
  let plan = 'unknown';
  if (firstDigit <= 3) plan = 'daily';
  else if (firstDigit <= 6) plan = 'monthly';
  else plan = 'yearly';

  console.log(`2. Code starts with ${firstDigit} → ${plan} plan`);

  // Step 3: User sends code to bot
  console.log(`3. User sends code to bot`);

  // Step 4: Bot validates code
  const validCodes = new Set([accessCode]); // Simulate valid codes
  const isValid = validCodes.has(accessCode);
  console.log(`4. Bot validates code: ${isValid ? '✅ Valid' : '❌ Invalid'}`);

  // Step 5: Bot provides group link
  const groupLinks = {
    daily: 'https://t.me/+daily_group',
    monthly: 'https://t.me/+monthly_group',
    yearly: 'https://t.me/+yearly_group'
  };

  console.log(`5. Bot sends group link: ${groupLinks[plan]}`);

  // Step 6: User joins group
  console.log(`6. User clicks link and joins group`);

  // Step 7: Bot approves user
  console.log(`7. Bot detects new member and approves automatically`);

  console.log(`\n🎉 User successfully joined ${plan} VVIP group!\n`);
}

// Main test function
function runTests() {
  console.log('🚀 Starting Telegram Bot Tests\n');
  console.log('='.repeat(50));

  testCodeGeneration();
  console.log('='.repeat(50));

  testCodeValidation();
  console.log('='.repeat(50));

  testPlanDetermination();
  console.log('='.repeat(50));

  testExistingCodeLoading();
  console.log('='.repeat(50));

  simulateUserFlow();
  console.log('='.repeat(50));

  console.log('✅ All tests completed!');
  console.log('\n💡 Next steps:');
  console.log('   1. Set up your Telegram bot with @BotFather');
  console.log('   2. Configure telegram-bot.js with your tokens');
  console.log('   3. Generate access codes: node generate-codes.js 10 daily');
  console.log('   4. Run the bot: npm start');
  console.log('   5. Test with real users!');
}

// Export for use in other scripts
module.exports = {
  testCodeGeneration,
  testCodeValidation,
  testPlanDetermination,
  simulateUserFlow
};

// Run tests if called directly
if (require.main === module) {
  runTests();
}