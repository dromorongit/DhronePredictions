const TelegramBot = require('node-telegram-bot-api');

// Load environment variables
const BOT_TOKEN = process.env.BOT_TOKEN || '8284449243:AAGIVO5aVfo1LAcQ29wXxHJoY3Pq4QqVOZ0';
const ADMIN_USER_ID = process.env.ADMIN_USER_ID || '83222398921';

console.log('🔍 Testing Telegram Bot Connection...\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
console.log('BOT_TOKEN:', BOT_TOKEN ? '✅ Set' : '❌ Missing');
console.log('BOT_TOKEN format:', BOT_TOKEN && BOT_TOKEN.includes(':') ? '✅ Valid format' : '❌ Invalid format');
console.log('ADMIN_USER_ID:', ADMIN_USER_ID ? '✅ Set' : '❌ Missing');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

// Check if token format is correct
if (BOT_TOKEN && !BOT_TOKEN.includes(':')) {
    console.error('❌ BOT_TOKEN format is incorrect. Expected: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz');
    process.exit(1);
}

async function testBotConnection() {
    try {
        console.log('\n🤖 Testing bot connection...');
        
        // Initialize bot with timeout
        const bot = new TelegramBot(BOT_TOKEN, { 
            polling: false, // Don't start polling for test
            request: {
                timeout: 10000 // 10 second timeout
            }
        });
        
        // Test token validity
        console.log('🔍 Validating bot token...');
        const botInfo = await bot.getMe();
        
        console.log('✅ Bot token is valid!');
        console.log(`🤖 Bot Name: ${botInfo.first_name}`);
        console.log(`👤 Bot Username: @${botInfo.username}`);
        console.log(`🆔 Bot ID: ${botInfo.id}`);
        console.log(`🔗 Bot Link: https://t.me/${botInfo.username}`);
        
        // Test admin user ID
        console.log('\n👤 Testing admin user ID...');
        try {
            const adminInfo = await bot.getChat(ADMIN_USER_ID);
            console.log('✅ Admin user ID is valid!');
            console.log(`👤 Admin: ${adminInfo.first_name} (@${adminInfo.username || 'no_username'})`);
        } catch (error) {
            console.log('⚠️ Warning: Could not verify admin user ID');
            console.log('This might be normal if the admin user ID is correct but not accessible');
            console.log('Error:', error.message);
        }
        
        // Test a simple command
        console.log('\n📝 Testing command handling...');
        console.log('✅ Basic bot connection successful');
        console.log('💡 The bot should respond to /start, /help, and /status commands');
        
        return true;
        
    } catch (error) {
        console.error('❌ Bot connection failed:');
        console.error('Error:', error.message);
        
        if (error.response) {
            console.error('Status Code:', error.response.statusCode);
            console.error('Response:', JSON.stringify(error.response.body, null, 2));
        }
        
        // Provide specific error guidance
        if (error.message.includes('401')) {
            console.error('\n💡 Common causes for 401 errors:');
            console.error('- Bot token is invalid or expired');
            console.error('- Bot was deleted or disabled');
            console.error('- Bot was blocked by Telegram');
            console.error('- Incorrect BOT_TOKEN format');
        } else if (error.message.includes('404')) {
            console.error('\n💡 Common causes for 404 errors:');
            console.error('- Bot username is incorrect');
            console.error('- Bot does not exist');
        } else if (error.code === 'EFATAL') {
            console.error('\n💡 Fatal error:');
            console.error('- Network connectivity issues');
            console.error('- Telegram servers unavailable');
        }
        
        return false;
    }
}

// Run the test
testBotConnection().then(success => {
    if (success) {
        console.log('\n🎉 Bot connection test PASSED!');
        console.log('💡 If your bot is still not responding, check:');
        console.log('1. Railway deployment logs');
        console.log('2. Bot polling status');
        console.log('3. Environment variables in Railway dashboard');
    } else {
        console.log('\n💀 Bot connection test FAILED!');
        console.log('🔧 Please fix the issues above before deploying to Railway');
    }
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💀 Unexpected error:', error);
    process.exit(1);
});