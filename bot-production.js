const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// Load configuration from environment variables (Railway-friendly)
const BOT_TOKEN = process.env.BOT_TOKEN || '8284449243:AAGIVO5aVfo1LAcQ29wXxHJoY3Pq4QqVOZ0';
const ADMIN_USER_ID = process.env.ADMIN_USER_ID || '5872136698';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate required environment variables
if (!BOT_TOKEN || !ADMIN_USER_ID) {
  console.error('❌ Missing required environment variables:');
  console.error('   BOT_TOKEN and ADMIN_USER_ID must be set');
  process.exit(1);
}

// Validate BOT_TOKEN format
if (!BOT_TOKEN.includes(':')) {
  console.error('❌ Invalid BOT_TOKEN format. Expected format: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz');
  process.exit(1);
}

console.log('✅ BOT_TOKEN format validated');
console.log('✅ ADMIN_USER_ID set');

// Initialize bot with production settings
const botOptions = {
  polling: true,
  filepath: false // Disable file sessions for Railway
};

// Add request timeout for production
if (NODE_ENV === 'production') {
  botOptions.request = {
    timeout: 30000
  };
}

const bot = new TelegramBot(BOT_TOKEN, botOptions);

// Store pending users (in production, use Redis or database)
const pendingUsers = new Map();
const usedCodes = new Set();

// Load access codes from file or environment
let validCodes = new Set([
  '7654321',
  '2421453',
  '2610932',
  '0331428',
  '2633376',
  '5532437',
  // Monthly VVIP Access Codes (First digit 4-6)
  '4123456', '4234567', '4345678', '4456789', '4567890',
  '5123456', '5234567', '5345678', '5456789', '5567890',
  '6123456', '6234567'
]);

// Load additional codes from environment variable
if (process.env.ACCESS_CODES) {
  const envCodes = process.env.ACCESS_CODES.split(',').map(code => code.trim());
  envCodes.forEach(code => validCodes.add(code));
}

// Group links
const GROUP_LINKS = {
  daily: 'https://t.me/+ZE_XiWcVZmU2YTA0',
  monthly: 'https://t.me/+9ihp-XFoRbRhZTJk',
  yearly: 'https://t.me/+6sf0IBhU2CZmM2U0'
};

// Logging function
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  if (data) {
    console.log(logMessage, JSON.stringify(data, null, 2));
  } else {
    console.log(logMessage);
  }

  // In production, send critical errors to admin (but not polling errors to avoid spam)
  if (NODE_ENV === 'production' && level === 'error' && !message.includes('Polling error')) {
    // Send error to admin (only for non-polling errors)
    bot.sendMessage(ADMIN_USER_ID, `🚨 Bot Error: ${message}`).catch(() => {
      console.log('Failed to send error message to admin (bot may have issues)');
    });
  }
}

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name;

  log('info', `User ${username} (${userId}) sent /start`);

  bot.sendMessage(chatId,
    `👋 *Welcome to Dhrone Predictions VVIP Access Bot!*

🎯 *To join our premium Telegram groups:*

1️⃣ Get your 7-digit access code from our website after payment
2️⃣ Send me your access code
3️⃣ I'll validate it and add you to the appropriate group

💡 *Send your access code now:*`, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔗 Visit Website', url: 'https://www.dhronepredicts.com' }]
      ]
    }
  }).catch(error => {
    log('error', 'Failed to send welcome message', { chatId, error: error.message });
  });
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId,
    `🆘 *Dhrone Predictions VVIP Access Bot - Help*

🤖 *Available Commands:*
• /start - Welcome message and instructions
• /help - Show this help message
• /status - Check your access status

📋 *How to Use:*
1️⃣ Pay for VVIP access on our website
2️⃣ Get your unique 7-digit access code
3️⃣ Send the code to me (e.g., 1234567)
4️⃣ I'll validate it and give you group access

🎯 *Subscription Plans:*
• Daily VVIP - ₵50 (24 hours)
• Monthly VVIP - ₵350 (30 days)
• Yearly VVIP - ₵1750 (365 days)

❓ *Need Help?*
Contact our support team or visit our website.`, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔗 Visit Website', url: 'https://www.dhronepredicts.com' }],
        [{ text: '📞 Contact Support', url: 'https://www.dhronepredicts.com/contact' }]
      ]
    }
  }).catch(error => {
    log('error', 'Failed to send help message', { chatId, error: error.message });
  });
});

// Handle /status command
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name;

  const pendingUser = pendingUsers.get(userId);

  if (pendingUser) {
    bot.sendMessage(chatId,
      `📊 *Your Access Status*

👤 *User:* ${username}
🎯 *Plan:* ${pendingUser.plan.charAt(0).toUpperCase() + pendingUser.plan.slice(1)} VVIP
🔢 *Code:* ${pendingUser.code}
⏰ *Validated:* ${pendingUser.timestamp.toLocaleString()}

✅ *Status:* Code validated, ready to join group!

🚀 Click below to join your premium group:`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: `🚀 Join ${pendingUser.plan.charAt(0).toUpperCase() + pendingUser.plan.slice(1)} VVIP Group`, url: GROUP_LINKS[pendingUser.plan] }]
        ]
      }
    }).catch(error => {
      log('error', 'Failed to send status message', { chatId, error: error.message });
    });
  } else {
    const totalCodes = validCodes.size;
    const usedCodesCount = usedCodes.size;
    const availableCodes = totalCodes - usedCodesCount;

    bot.sendMessage(chatId,
      `📊 *Your Access Status*

👤 *User:* ${username}
❌ *Status:* No active access code

📈 *System Stats:*
• Total codes available: ${totalCodes}
• Codes used: ${usedCodesCount}
• Codes remaining: ${availableCodes}

💡 *To get access:*
1. Visit our website
2. Purchase a VVIP subscription
3. Get your 7-digit access code
4. Send it to me

🎯 Ready to get premium access?`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛒 Get VVIP Access', url: 'https://www.dhronepredicts.com/vvip' }],
          [{ text: '❓ Need Help?', callback_data: 'help' }]
        ]
      }
    }).catch(error => {
      log('error', 'Failed to send status message', { chatId, error: error.message });
    });
  }
});

// Handle access code messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name;
  const text = msg.text;

  // Skip if it's a command or not a private chat
  if (text && text.startsWith('/')) return;
  if (msg.chat.type !== 'private') return;

  // Check if message is a 7-digit code
  if (/^\d{7}$/.test(text)) {
    await handleAccessCode(chatId, userId, username, text);
  } else if (text && text.length > 0) {
    bot.sendMessage(chatId,
      `❌ *Invalid format!*

Please send your *7-digit access code* (e.g., 1234567)

💡 Get your code from our website after payment.`, {
      parse_mode: 'Markdown'
    }).catch(error => {
      log('error', 'Failed to send invalid format message', { chatId, error: error.message });
    });
  }
});

// Handle new chat members (when users join groups)
bot.on('new_chat_members', async (msg) => {
  const chatId = msg.chat.id;
  const newMembers = msg.new_chat_members;

  // Check if this is one of our premium groups
  const isPremiumGroup = Object.values(GROUP_LINKS).some(link =>
    link.includes(chatId.toString())
  );

  if (!isPremiumGroup) return;

  for (const member of newMembers) {
    if (member.is_bot) continue; // Skip bots

    const userId = member.id;
    const username = member.username || member.first_name;

    // Check if user has a valid pending request
    if (pendingUsers.has(userId)) {
      const userData = pendingUsers.get(userId);

      try {
        await bot.approveChatJoinRequest(chatId, userId);
        await bot.sendMessage(chatId,
          `🎉 Welcome ${username} to the ${userData.plan} VVIP Group!

📊 Enjoy exclusive premium predictions and insights!
💬 Feel free to ask questions and engage with the community.`, {
          parse_mode: 'Markdown'
        });

        // Notify admin
        await notifyAdmin(userData, username);

        // Clean up
        pendingUsers.delete(userId);
        usedCodes.add(userData.code);

        log('info', `User ${username} successfully added to ${userData.plan} group`);

      } catch (error) {
        log('error', 'Error adding user to group', { username, plan: userData.plan, error: error.message });
        await bot.sendMessage(chatId,
          `⚠️ There was an issue adding ${username}. Please contact support.`
        ).catch(() => {});
      }
    } else {
      // User joined without valid access code
      await bot.sendMessage(chatId,
        `🚫 @${username}, you need a valid access code to join this group.

💡 Get your code from our website: https://www.dhronepredicts.com
🤖 Then message me (@${bot.username}) with your code.`, {
        parse_mode: 'Markdown'
      });

      // Remove user from group
      try {
        await bot.banChatMember(chatId, userId);
        await bot.unbanChatMember(chatId, userId);
        log('info', `Unauthorized user ${username} removed from group`);
      } catch (error) {
        log('error', 'Error removing unauthorized user', { username, error: error.message });
      }
    }
  }
});

// Handle access code validation
async function handleAccessCode(chatId, userId, username, code) {
  try {
    log('info', `Processing access code from ${username}`, { code, userId });

    // Check if code is valid and not used
    if (!validCodes.has(code)) {
      log('warn', `Invalid access code attempted: ${code} by ${username}`);
      return bot.sendMessage(chatId,
        `❌ *Invalid Access Code!*

The code "${code}" is not valid or has expired.

💡 Please check your code and try again, or get a new one from our website.`, {
        parse_mode: 'Markdown'
      });
    }

    if (usedCodes.has(code)) {
      log('warn', `Used access code attempted: ${code} by ${username}`);
      return bot.sendMessage(chatId,
        `❌ *Code Already Used!*

The code "${code}" has already been used.

💡 Each code can only be used once. Get a new code from our website.`, {
        parse_mode: 'Markdown'
      });
    }

    // Determine which group based on code pattern
    const plan = determinePlanFromCode(code);

    // Store user data for when they join the group
    pendingUsers.set(userId, {
      code: code,
      plan: plan,
      timestamp: new Date(),
      username: username
    });

    // Send success message with group link
    const groupLink = GROUP_LINKS[plan];

    await bot.sendMessage(chatId,
      `✅ *Access Code Validated!*

🎯 *Plan:* ${plan.charAt(0).toUpperCase() + plan.slice(1)} VVIP
🔢 *Code:* ${code}

🚀 *Click below to join your premium group:*`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: `🚀 Join ${plan.charAt(0).toUpperCase() + plan.slice(1)} VVIP Group`, url: groupLink }],
          [{ text: '🔄 Generate New Code', url: 'https://www.dhronepredicts.com' }]
        ]
      }
    });

    // Mark code as used
    usedCodes.add(code);

    log('info', `Access code validated for ${username}`, { code, plan, userId });

  } catch (error) {
    log('error', 'Error handling access code', { code, username, error: error.message });
    bot.sendMessage(chatId,
      `❌ *Error processing your request*

Please try again later or contact support.`
    ).catch(() => {});
  }
}

// Determine plan from code
function determinePlanFromCode(code) {
  const firstDigit = parseInt(code.charAt(0));

  if (firstDigit <= 3) return 'daily';
  if (firstDigit <= 6) return 'monthly';
  return 'yearly';
}

// Notify admin about new user
async function notifyAdmin(userData, username) {
  try {
    const message =
      `🎉 *New VVIP Member Added!*

👤 *User:* ${username}
🎯 *Plan:* ${userData.plan.charAt(0).toUpperCase() + userData.plan.slice(1)}
🔢 *Code:* ${userData.code}
⏰ *Time:* ${new Date().toLocaleString()}`;

    await bot.sendMessage(ADMIN_USER_ID, message, { parse_mode: 'Markdown' });
    log('info', `Admin notified about new member: ${username}`, { plan: userData.plan });
  } catch (error) {
    log('error', 'Error notifying admin', { username, error: error.message });
  }
}

// Health check endpoint for Railway
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      bot_status: 'running',
      pending_users: pendingUsers.size,
      used_codes: usedCodes.size
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  log('info', `Health check server listening on port ${PORT}`);
});

// Handle callback queries
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;

  if (query.data === 'help') {
    // Show help message
    bot.answerCallbackQuery(query.id);
    bot.sendMessage(chatId, 'Need help? Visit our website: https://www.dhronepredicts.com/contact');
  }
});

// Error handling with retry mechanism
let pollingRetryCount = 0;
const MAX_POLLING_RETRIES = 5;
const POLLING_RETRY_DELAY = 10000; // 10 seconds

bot.on('polling_error', (error) => {
  pollingRetryCount++;
  console.error(`🚨 POLLING ERROR #${pollingRetryCount}:`, error.message);
  console.error('Error code:', error.code);
  console.error('Error response:', error.response?.body);

  // Provide specific error messages
  if (error.code === 'EFATAL') {
    console.error('💀 FATAL ERROR: Bot token may be invalid or bot is blocked');
    console.error('🔄 Stopping polling to prevent spam...');
    bot.stopPolling();
    return;
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    console.error('🌐 NETWORK ERROR: Cannot reach Telegram servers');
  } else if (error.code === 'ETIMEDOUT') {
    console.error('⏰ TIMEOUT ERROR: Request to Telegram timed out');
  }

  // Retry logic
  if (pollingRetryCount < MAX_POLLING_RETRIES) {
    console.log(`⏳ Retrying in ${POLLING_RETRY_DELAY / 1000} seconds... (${pollingRetryCount}/${MAX_POLLING_RETRIES})`);
    setTimeout(() => {
      console.log('🔄 Attempting to restart polling...');
      bot.startPolling().catch(retryError => {
        console.error('❌ Retry failed:', retryError.message);
      });
    }, POLLING_RETRY_DELAY);
  } else {
    console.error('💀 MAX RETRIES REACHED: Giving up on polling');
    console.error('💡 Please check your BOT_TOKEN and network connectivity');
    bot.stopPolling();
  }

  log('error', 'Polling error occurred', {
    error: error.message,
    code: error.code,
    response: error.response?.body,
    retryCount: pollingRetryCount
  });
});

bot.on('error', (error) => {
  console.error('🚨 BOT ERROR:', error.message);
  log('error', 'Bot error occurred', { error: error.message });
});

// Graceful shutdown
process.on('SIGINT', () => {
  log('info', 'Received SIGINT, shutting down gracefully');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('info', 'Received SIGTERM, shutting down gracefully');
  bot.stopPolling();
  process.exit(0);
});

// Validate bot token before starting
async function validateBotToken() {
  try {
    console.log('🔍 Validating bot token...');
    const botInfo = await bot.getMe();
    console.log('✅ Bot token is valid!');
    console.log(`🤖 Bot Name: ${botInfo.first_name}`);
    console.log(`👤 Bot Username: @${botInfo.username}`);
    console.log(`🆔 Bot ID: ${botInfo.id}`);
    return true;
  } catch (error) {
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

    return false;
  }
}

// Initialize bot
async function startBot() {
  console.log('🤖 Dhrone Predictions Telegram Bot Starting...');
  console.log(`📅 Environment: ${NODE_ENV}`);
  console.log(`🔢 Total access codes loaded: ${validCodes.size}`);
  console.log(`👤 Admin User ID: ${ADMIN_USER_ID}`);

  // Validate token first
  const isTokenValid = await validateBotToken();

  if (!isTokenValid) {
    console.error('💀 Cannot start bot: Invalid token');
    console.error('🔧 Please fix BOT_TOKEN in Railway environment variables');
    process.exit(1);
  }

  console.log('✅ Bot is ready to receive messages!\n');

  // Start polling with error handling
  try {
    await bot.startPolling();
    console.log('🔄 Polling started successfully');
  } catch (error) {
    console.error('❌ Failed to start polling:', error.message);
    process.exit(1);
  }
}

// Start the bot
startBot().catch(error => {
  console.error('💀 Fatal error starting bot:', error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log('error', 'Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log('error', 'Unhandled rejection', { reason: reason.toString(), promise: promise.toString() });
  process.exit(1);
});

module.exports = { bot, pendingUsers, usedCodes, validCodes };