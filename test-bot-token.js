const TelegramBot = require('node-telegram-bot-api');

console.log('🔍 Validating Bot Token...\n');

// Replace this with your actual bot token from @BotFather
const BOT_TOKEN = '8284449243:AAGIVO5aVfo1LAcQ29wXxHJoY3Pq4QqVOZ0';

async function validateBotToken() {
    console.log('Testing bot token:', BOT_TOKEN.substring(0, 10) + '...');
    
    try {
        const bot = new TelegramBot(BOT_TOKEN, { polling: false });
        const botInfo = await bot.getMe();
        
        console.log('✅ SUCCESS! Bot token is valid');
        console.log('🤖 Bot Name:', botInfo.first_name);
        console.log('👤 Username:', '@' + botInfo.username);
        console.log('🆔 ID:', botInfo.id);
        console.log('🔗 Link: https://t.me/' + botInfo.username);
        
        return true;
    } catch (error) {
        console.log('❌ FAILED! Bot token validation failed');
        console.log('Error:', error.message);
        
        if (error.message.includes('401')) {
            console.log('\n💡 This usually means:');
            console.log('- Bot token is invalid or expired');
            console.log('- Bot was deleted from Telegram');
            console.log('- Bot was blocked by Telegram');
            console.log('\n🔧 Solution: Get a new token from @BotFather');
        } else if (error.message.includes('404')) {
            console.log('\n💡 This usually means:');
            console.log('- Bot does not exist');
            console.log('- Bot username is incorrect');
            console.log('\n🔧 Solution: Check your bot username with @BotFather');
        } else {
            console.log('\n💡 Network or other issue');
            console.log('Try again in a moment or check your internet connection');
        }
        
        return false;
    }
}

validateBotToken().then(success => {
    console.log('\n' + '='.repeat(50));
    if (success) {
        console.log('🎉 Your bot token is working fine!');
        console.log('💡 If your bot still doesn\'t respond on Railway:');
        console.log('1. Check Railway environment variables are set correctly');
        console.log('2. Check Railway logs for errors');
        console.log('3. Make sure BOT_TOKEN is set in Railway dashboard');
    } else {
        console.log('💀 Bot token validation failed!');
        console.log('🔧 You need to fix this before the bot will work on Railway');
    }
    process.exit(success ? 0 : 1);
});