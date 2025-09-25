const TelegramBot = require('node-telegram-bot-api');

// Your bot configuration
const BOT_TOKEN = '8284449243:AAFUhi2-GkVbb4Lp3Or_SbBsREnCUaTaPls';
const ADMIN_USER_ID = '5872136698';

console.log('🔍 Testing Telegram Bot Connection...\n');

// Test 1: Check if token format is valid
function testTokenFormat() {
  console.log('1️⃣ Testing bot token format...');
  if (BOT_TOKEN.includes(':')) {
    const parts = BOT_TOKEN.split(':');
    if (parts.length === 2 && parts[0].length > 0 && parts[1].length > 0) {
      console.log('   ✅ Token format looks valid');
      return true;
    }
  }
  console.log('   ❌ Token format is invalid');
  return false;
}

// Test 2: Try to initialize bot
function testBotInitialization() {
  console.log('\n2️⃣ Testing bot initialization...');
  try {
    const bot = new TelegramBot(BOT_TOKEN, { polling: false });
    console.log('   ✅ Bot initialized successfully');
    return bot;
  } catch (error) {
    console.log('   ❌ Failed to initialize bot:', error.message);
    return null;
  }
}

// Test 3: Test bot info retrieval
async function testBotInfo(bot) {
  console.log('\n3️⃣ Testing bot information retrieval...');
  try {
    const botInfo = await bot.getMe();
    console.log('   ✅ Successfully connected to Telegram API');
    console.log('   🤖 Bot Info:');
    console.log('      - Name:', botInfo.first_name);
    console.log('      - Username:', botInfo.username);
    console.log('      - ID:', botInfo.id);
    return true;
  } catch (error) {
    console.log('   ❌ Failed to get bot info:', error.message);
    console.log('   💡 Possible causes:');
    console.log('      - Invalid bot token');
    console.log('      - Network connectivity issues');
    console.log('      - Bot token expired or revoked');
    return false;
  }
}

// Test 4: Test sending message to admin
async function testSendMessage(bot) {
  console.log('\n4️⃣ Testing message sending capability...');
  try {
    const result = await bot.sendMessage(ADMIN_USER_ID,
      '🤖 *Bot Connection Test*\n\n' +
      '✅ Bot is working correctly!\n' +
      '📅 Test performed: ' + new Date().toLocaleString(), {
      parse_mode: 'Markdown'
    });
    console.log('   ✅ Successfully sent test message');
    console.log('   📤 Message ID:', result.message_id);
    return true;
  } catch (error) {
    console.log('   ❌ Failed to send message:', error.message);
    console.log('   💡 Possible causes:');
    console.log('      - Invalid admin user ID');
    console.log('      - Bot not authorized to send messages');
    console.log('      - Admin has blocked the bot');
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Telegram Bot Connection Tests...\n');

  // Test token format
  const tokenValid = testTokenFormat();

  if (!tokenValid) {
    console.log('\n❌ Bot token is invalid. Please check your token from @BotFather');
    return;
  }

  // Test bot initialization
  const bot = testBotInitialization();

  if (!bot) {
    console.log('\n❌ Failed to initialize bot. Check your token and network connection.');
    return;
  }

  // Test bot info
  const infoSuccess = await testBotInfo(bot);

  if (!infoSuccess) {
    console.log('\n❌ Cannot connect to Telegram API. Check your internet connection and bot token.');
    return;
  }

  // Test message sending
  const messageSuccess = await testSendMessage(bot);

  if (messageSuccess) {
    console.log('\n🎉 All tests passed! Your bot is working correctly.');
    console.log('💡 You should receive a test message in your Telegram app.');
  } else {
    console.log('\n⚠️ Bot can connect but has issues sending messages.');
    console.log('   This might be due to admin user ID or permissions.');
  }

  console.log('\n📋 Next Steps:');
  console.log('   1. Check if you received the test message');
  console.log('   2. If not, verify your ADMIN_USER_ID');
  console.log('   3. Try running the main bot: node telegram-bot.js');
  console.log('   4. Test /start command in your bot chat');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
});

// Run the tests
runTests().catch(console.error);