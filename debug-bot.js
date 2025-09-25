const TelegramBot = require('node-telegram-bot-api');

// Get token from environment or use default
const BOT_TOKEN = process.env.BOT_TOKEN || '8284449243:AAGIVO5aVfo1LAcQ29wXxHJoY3Pq4QqVOZ0';

console.log('🔍 === BOT TOKEN DEBUGGER ===');
console.log(`🤖 Token: ${BOT_TOKEN.substring(0, 10)}...${BOT_TOKEN.substring(BOT_TOKEN.length - 5)}`);

// Validate token format
if (!BOT_TOKEN.includes(':')) {
  console.error('❌ Invalid token format');
  process.exit(1);
}

console.log('✅ Token format is valid');

// Test bot initialization
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

async function testBot() {
  try {
    console.log('\n🔍 Testing bot connection...');

    const botInfo = await bot.getMe();
    console.log('✅ SUCCESS: Bot is accessible!');
    console.log(`🤖 Bot Name: ${botInfo.first_name}`);
    console.log(`👤 Username: @${botInfo.username}`);
    console.log(`🆔 Bot ID: ${botInfo.id}`);
    console.log(`🌐 Can Join Groups: ${botInfo.can_join_groups ? 'Yes' : 'No'}`);
    console.log(`📢 Can Read Messages: ${botInfo.can_read_all_group_messages ? 'Yes' : 'No'}`);

    console.log('\n🎉 Bot token is working perfectly!');
    console.log('💡 If Railway still shows errors, check:');
    console.log('   - Network connectivity');
    console.log('   - Railway environment variables');
    console.log('   - Bot permissions in Telegram');

  } catch (error) {
    console.error('\n❌ FAILED: Bot token is not working');
    console.error(`Error: ${error.message}`);

    if (error.response) {
      console.error(`Status: ${error.response.statusCode}`);
      console.error(`Details: ${JSON.stringify(error.response.body, null, 2)}`);
    }

    if (error.message.includes('401')) {
      console.error('\n💡 SOLUTION: Get a new token from BotFather');
      console.error('1. Go to @BotFather on Telegram');
      console.error('2. Send: /token');
      console.error('3. Select your bot');
      console.error('4. Copy the new token');
      console.error('5. Update BOT_TOKEN in Railway');
    }

    process.exit(1);
  }
}

testBot();