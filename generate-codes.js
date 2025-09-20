#!/usr/bin/env node

/**
 * Access Code Generator for Dhrone Predictions Telegram Bot
 *
 * Usage:
 * node generate-codes.js [number-of-codes] [plan]
 *
 * Examples:
 * node generate-codes.js 10 daily
 * node generate-codes.js 5 monthly
 * node generate-codes.js 3 yearly
 */

const fs = require('fs');
const path = require('path');

// Generate a unique 7-digit code
function generateCode() {
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
}

// Generate multiple unique codes
function generateUniqueCodes(count, existingCodes = new Set()) {
  const codes = new Set();

  while (codes.size < count) {
    const code = generateCode();
    if (!existingCodes.has(code)) {
      codes.add(code);
    }
  }

  return Array.from(codes);
}

// Load existing codes from telegram-bot.js
function loadExistingCodes() {
  try {
    const botFile = path.join(__dirname, 'telegram-bot.js');
    const content = fs.readFileSync(botFile, 'utf8');

    // Extract codes from the validCodes Set
    const codeMatch = content.match(/validCodes = new Set\(\[([\s\S]*?)\]\)/);
    if (codeMatch) {
      const codesString = codeMatch[1];
      const codes = codesString
        .split(',')
        .map(code => code.trim().replace(/['"]/g, ''))
        .filter(code => code && /^\d{7}$/.test(code));

      return new Set(codes);
    }
  } catch (error) {
    console.log('Could not load existing codes, starting fresh');
  }

  return new Set();
}

// Save codes to telegram-bot.js
function saveCodesToBot(codes, plan) {
  try {
    const botFile = path.join(__dirname, 'telegram-bot.js');
    let content = fs.readFileSync(botFile, 'utf8');

    // Load existing codes
    const existingCodes = loadExistingCodes();

    // Add new codes
    codes.forEach(code => existingCodes.add(code));

    // Convert to formatted string
    const codesArray = Array.from(existingCodes);
    const codesString = codesArray.map(code => `  '${code}'`).join(',\n');

    // Replace in file
    const newValidCodes = `validCodes = new Set([\n${codesString}\n]);`;
    content = content.replace(/validCodes = new Set\(\[[\s\S]*?\]\);/, newValidCodes);

    fs.writeFileSync(botFile, content, 'utf8');
    console.log(`✅ Added ${codes.length} ${plan} codes to telegram-bot.js`);

  } catch (error) {
    console.error('❌ Error saving codes to bot file:', error.message);
  }
}

// Save codes to a separate file for backup
function saveCodesToFile(codes, plan) {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `access-codes-${plan}-${timestamp}.txt`;

  const content = `Dhrone Predictions - ${plan.charAt(0).toUpperCase() + plan.slice(1)} VVIP Access Codes\n`;
  const separator = '='.repeat(50) + '\n';
  const header = `Generated: ${new Date().toLocaleString()}\n`;
  const count = `Total Codes: ${codes.length}\n\n`;

  const codesList = codes.map((code, index) =>
    `${(index + 1).toString().padStart(3, '0')}. ${code}`
  ).join('\n');

  const fullContent = content + separator + header + count + codesList + '\n' + separator;

  fs.writeFileSync(filename, fullContent, 'utf8');
  console.log(`💾 Codes saved to: ${filename}`);
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const count = parseInt(args[0]) || 5;
  const plan = args[1] || 'daily';

  if (count < 1 || count > 1000) {
    console.error('❌ Please specify a count between 1 and 1000');
    process.exit(1);
  }

  if (!['daily', 'monthly', 'yearly'].includes(plan)) {
    console.error('❌ Plan must be: daily, monthly, or yearly');
    process.exit(1);
  }

  console.log(`🎯 Generating ${count} ${plan} access codes...`);

  // Load existing codes to avoid duplicates
  const existingCodes = loadExistingCodes();
  console.log(`📊 Found ${existingCodes.size} existing codes`);

  // Generate new codes
  const newCodes = generateUniqueCodes(count, existingCodes);
  console.log(`✨ Generated ${newCodes.length} new codes`);

  // Display codes
  console.log(`\n🔢 ${plan.charAt(0).toUpperCase() + plan.slice(1)} Access Codes:`);
  console.log('='.repeat(30));
  newCodes.forEach((code, index) => {
    console.log(`${(index + 1).toString().padStart(2, ' ')}. ${code}`);
  });
  console.log('='.repeat(30));

  // Save to bot file
  saveCodesToBot(newCodes, plan);

  // Save to backup file
  saveCodesToFile(newCodes, plan);

  console.log(`\n🎉 Success! ${count} ${plan} access codes generated and saved.`);
  console.log(`📋 Copy these codes to your telegram-bot.js validCodes Set if needed.`);
}

// Export functions for use in other scripts
module.exports = {
  generateCode,
  generateUniqueCodes,
  loadExistingCodes
};

// Run if called directly
if (require.main === module) {
  main();
}