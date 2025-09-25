const TelegramBot = require('node-telegram-bot-api');

// Test bot token validation
const BOT_TOKEN = process.env.BOT_TOKEN || '8284449243:AAFUhi2-GkVbb4Lp3Or_SbBsREnCUaTaPls';

console.log('🔍 Testing Bot Token Validation...');
console.log(`🤖 Bot Token: ${BOT_TOKEN.substring(0, 10)}...${BOT_TOKEN.substring(BOT_TOKEN.length - 5)}`);

// Validate token format
if (!BOT_TOKEN.includes(':')) {
  console.error('❌ Invalid BOT_TOKEN format');
  process.exit(1);
}

console.log('✅ BOT_TOKEN format is valid');

// Test bot initialization (without polling)
try {
  const bot = new TelegramBot(BOT_TOKEN, { polling: false });

  // Test getMe to verify token works
  bot.getMe().then((botInfo) => {
    console.log('✅ Bot token is valid!');
    console.log(`🤖 Bot Name: ${botInfo.first_name}`);
    console.log(`👤 Bot Username: @${botInfo.username}`);
    console.log(`🆔 Bot ID: ${botInfo.id}`);
    console.log('🎉 Token validation successful!');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Bot token validation failed:');
    console.error(`Error: ${error.message}`);

    if (error.response) {
      console.error(`Status Code: ${error.response.statusCode}`);
      console.error(`Response: ${JSON.stringify(error.response.body, null, 2)}`);
    }

    if (error.message.includes('401')) {
      console.error('💡 This usually means:');
      console.error('   - Bot token is invalid or expired');
      console.error('   - Bot was deleted from Telegram');
      console.error('   - Bot was blocked by Telegram');
    }

    process.exit(1);
  });

} catch (error) {
  console.error('❌ Failed to initialize bot:');
  console.error(error.message);
  process.exit(1);
}