#!/usr/bin/env node

/**
 * Railway Deployment Checker for Dhrone Predictions Bot
 * Run this locally to verify your Railway deployment setup
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Railway Deployment Setup...\n');

// Check 1: Required files exist
console.log('1️⃣ Checking required files...');

const requiredFiles = [
  'package.json',
  'railway.toml',
  'bot-production.js',
  'telegram-bot.js'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING!`);
    allFilesExist = false;
  }
});

// Check 2: Package.json validation
console.log('\n2️⃣ Validating package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('   ✅ package.json is valid JSON');
  console.log(`   📦 Name: ${packageJson.name}`);
  console.log(`   🚀 Main: ${packageJson.main}`);
  console.log(`   📋 Scripts: ${Object.keys(packageJson.scripts).join(', ')}`);

  if (packageJson.dependencies && packageJson.dependencies['node-telegram-bot-api']) {
    console.log('   ✅ Telegram bot dependency found');
  } else {
    console.log('   ❌ Telegram bot dependency missing');
    allFilesExist = false;
  }
} catch (error) {
  console.log('   ❌ package.json is invalid:', error.message);
  allFilesExist = false;
}

// Check 3: Railway configuration
console.log('\n3️⃣ Checking railway.toml...');
if (fs.existsSync('railway.toml')) {
  const railwayConfig = fs.readFileSync('railway.toml', 'utf8');
  console.log('   ✅ railway.toml exists');

  if (railwayConfig.includes('startCommand')) {
    console.log('   ✅ Start command configured');
  } else {
    console.log('   ❌ Start command missing');
    allFilesExist = false;
  }

  if (railwayConfig.includes('NODE_ENV')) {
    console.log('   ✅ Environment variables configured');
  } else {
    console.log('   ❌ Environment variables missing');
    allFilesExist = false;
  }
} else {
  console.log('   ❌ railway.toml not found');
  allFilesExist = false;
}

// Check 4: Bot files validation
console.log('\n4️⃣ Validating bot files...');
const botFiles = ['telegram-bot.js', 'bot-production.js'];
botFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('BOT_TOKEN')) {
      console.log(`   ✅ ${file} contains bot configuration`);
    } else {
      console.log(`   ❌ ${file} missing bot configuration`);
      allFilesExist = false;
    }
  } else {
    console.log(`   ❌ ${file} not found`);
    allFilesExist = false;
  }
});

// Check 5: Environment variables check
console.log('\n5️⃣ Checking environment variables...');
const envVars = ['BOT_TOKEN', 'ADMIN_USER_ID', 'ACCESS_CODES'];
let envVarsSet = 0;

envVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`   ✅ ${envVar} is set`);
    envVarsSet++;
  } else {
    console.log(`   ⚠️ ${envVar} not set locally (will be set in Railway)`);
  }
});

// Summary
console.log('\n📊 Deployment Readiness Summary:');
console.log('='.repeat(40));

if (allFilesExist) {
  console.log('✅ All required files are present');
} else {
  console.log('❌ Some required files are missing');
}

if (envVarsSet === envVars.length) {
  console.log('✅ All environment variables are set locally');
} else {
  console.log(`⚠️ ${envVarsSet}/${envVars.length} environment variables set locally`);
  console.log('   💡 Environment variables should be set in Railway dashboard');
}

console.log('\n🚀 Railway Deployment Instructions:');
console.log('='.repeat(40));
console.log('1. 📤 Push all files to GitHub');
console.log('2. 🌐 Connect repository to Railway');
console.log('3. ⚙️ Set environment variables in Railway:');
console.log('   - BOT_TOKEN = 8284449243:AAFUhi2-GkVbb4Lp3Or_SbBsREnCUaTaPls');
console.log('   - ADMIN_USER_ID = 5872136698');
console.log('   - ACCESS_CODES = 7654321,2421453,2610932,0331428,2633376,5532437');
console.log('   - NODE_ENV = production');
console.log('4. 🚀 Deploy and monitor logs');
console.log('5. 🧪 Test bot with /start command');

console.log('\n🔍 Quick Test Commands:');
console.log('='.repeat(40));
console.log('# Test locally:');
console.log('npm run test');
console.log('');
console.log('# Run locally:');
console.log('npm run dev');
console.log('');
console.log('# Railway will run:');
console.log('npm run railway');

console.log('\n🎯 Expected Railway Behavior:');
console.log('='.repeat(40));
console.log('✅ Railway builds from package.json');
console.log('✅ Uses railway.toml configuration');
console.log('✅ Loads environment variables');
console.log('✅ Starts bot with npm run railway');
console.log('✅ Bot runs 24/7 automatically');
console.log('✅ Auto-restarts on failures');
console.log('✅ Logs available in Railway dashboard');

if (allFilesExist) {
  console.log('\n🎉 Your deployment setup looks good!');
  console.log('💡 Push to GitHub and deploy on Railway');
} else {
  console.log('\n⚠️ Fix the missing files before deploying');
  console.log('🔧 Run: npm install node-telegram-bot-api');
  console.log('🔧 Ensure all required files exist');
}

console.log('\n📞 Need Help?');
console.log('Check RAILWAY_DEPLOYMENT_README.md for detailed instructions');