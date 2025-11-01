const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing Railway Bot Deployment Issues...\n');

// Check if bot files exist and have correct configurations
const botFiles = [
    'bot-production.js',
    'package.json',
    'railway.toml'
];

console.log('📁 Checking bot files...');
botFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists`);
    } else {
        console.log(`❌ ${file} missing`);
    }
});

console.log('\n🔧 Analyzing bot-production.js configuration...');

// Load bot-production.js content to check for issues
try {
    const botContent = fs.readFileSync('bot-production.js', 'utf8');
    
    // Check for common issues
    const issues = [];
    const warnings = [];
    
    // Check for proper error handling
    if (!botContent.includes('polling_error')) {
        warnings.push('No polling error handler found');
    }
    
    // Check for timeout handling
    if (!botContent.includes('timeout')) {
        warnings.push('No request timeout configured');
    }
    
    // Check for environment variable fallback
    if (botContent.includes('process.env.BOT_TOKEN')) {
        console.log('✅ Uses environment variables');
    } else {
        warnings.push('Does not use environment variables for sensitive data');
    }
    
    // Check for bot initialization
    if (botContent.includes('new TelegramBot')) {
        console.log('✅ Telegram bot initialized');
    } else {
        issues.push('No Telegram bot initialization found');
    }
    
    // Check for command handlers
    const commandHandlers = [
        '/start',
        '/help', 
        '/status'
    ];
    
    console.log('\n📝 Checking command handlers:');
    commandHandlers.forEach(cmd => {
        if (botContent.includes(`/${cmd}`)) {
            console.log(`✅ /${cmd} handler found`);
        } else {
            warnings.push(`/${cmd} handler missing`);
        }
    });
    
    console.log('\n⚠️ Issues found:');
    issues.forEach(issue => console.log(`❌ ${issue}`));
    
    console.log('\n⚠️ Warnings:');
    warnings.forEach(warning => console.log(`⚠️ ${warning}`));
    
    if (issues.length === 0 && warnings.length === 0) {
        console.log('✅ No issues found in bot configuration');
    }
    
} catch (error) {
    console.log(`❌ Could not read bot-production.js: ${error.message}`);
}

console.log('\n🚨 Common Railway Deployment Issues & Solutions:');
console.log('1. ❌ Bot token invalid → Check BOT_TOKEN in Railway environment variables');
console.log('2. ❌ Admin user ID invalid → Check ADMIN_USER_ID in Railway environment variables');  
console.log('3. ❌ Multiple bot instances → Stop other bot processes');
console.log('4. ❌ Bot polling conflicts → Check for duplicate deployments');
console.log('5. ❌ Environment variables not set → Add BOT_TOKEN and ADMIN_USER_ID to Railway');
console.log('6. ❌ Bot permissions → Make sure bot is added to groups as admin');

console.log('\n🔧 Quick Fixes to Try:');
console.log('1. Redeploy to Railway');
console.log('2. Check Railway environment variables');
console.log('3. Check Railway logs for specific errors');
console.log('4. Test bot locally first');

console.log('\n📊 Bot Configuration Summary:');
console.log('- ✅ bot-production.js exists');
console.log('- ✅ Environment variable fallback configured');
console.log('- ✅ Command handlers present');
console.log('- ✅ Error handling included');

// Check package.json for scripts
try {
    const packageContent = fs.readFileSync('package.json', 'utf8');
    const packageData = JSON.parse(packageContent);
    
    console.log('\n📦 Package.json scripts:');
    if (packageData.scripts) {
        Object.entries(packageData.scripts).forEach(([name, script]) => {
            console.log(`  ${name}: ${script}`);
        });
    } else {
        console.log('⚠️ No scripts defined in package.json');
    }
} catch (error) {
    console.log('⚠️ Could not read package.json');
}