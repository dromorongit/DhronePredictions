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
  console.error('🔧 Please set these in Railway environment variables');
}

// Validate BOT_TOKEN format
if (!BOT_TOKEN.includes(':')) {
  console.error('❌ Invalid BOT_TOKEN format. Expected format: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz');
  console.error('🔧 Please check your BOT_TOKEN in Railway environment variables');
}

if (BOT_TOKEN && ADMIN_USER_ID && BOT_TOKEN.includes(':')) {
  console.log('✅ BOT_TOKEN format validated');
  console.log('✅ ADMIN_USER_ID set');
} else {
  console.log('⚠️ Environment variables not properly configured');
}

// Initialize bot with production settings
const botOptions = {
  polling: true, // Enable polling for Railway
  filepath: false // Disable file sessions for Railway
};

// Add request timeout for production
if (NODE_ENV === 'production') {
  botOptions.request = {
    timeout: 30000
  };
}

const bot = new TelegramBot(BOT_TOKEN, botOptions);

// Data persistence files
const DATA_DIR = path.join(__dirname, 'data');
const PENDING_USERS_FILE = path.join(DATA_DIR, 'pendingUsers.json');
const USED_CODES_FILE = path.join(DATA_DIR, 'usedCodes.json');
const ACTIVE_SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'activeSubscriptions.json');
const USER_HISTORY_FILE = path.join(DATA_DIR, 'userHistory.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Store pending users (persisted to JSON)
const pendingUsers = new Map();
const usedCodes = new Set();

// Store active subscriptions with expiry dates (persisted to JSON)
const activeSubscriptions = new Map();

// Store user history for better status tracking (persisted to JSON)
const userHistory = new Map(); // userId -> { lastStatus: 'active'|'pending'|'none', lastCheck: Date }

// Load data from JSON files
function loadData() {
  try {
    // Load pendingUsers
    if (fs.existsSync(PENDING_USERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PENDING_USERS_FILE, 'utf8'));
      for (const [key, value] of Object.entries(data)) {
        pendingUsers.set(key, { ...value, timestamp: new Date(value.timestamp) });
      }
      console.log(`✅ Loaded ${pendingUsers.size} pending users`);
    }

    // Load usedCodes
    if (fs.existsSync(USED_CODES_FILE)) {
      const data = JSON.parse(fs.readFileSync(USED_CODES_FILE, 'utf8'));
      data.forEach(code => usedCodes.add(code));
      console.log(`✅ Loaded ${usedCodes.size} used codes`);
    }

    // Load activeSubscriptions
    if (fs.existsSync(ACTIVE_SUBSCRIPTIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(ACTIVE_SUBSCRIPTIONS_FILE, 'utf8'));
      for (const [key, value] of Object.entries(data)) {
        activeSubscriptions.set(key, {
          ...value,
          startDate: new Date(value.startDate),
          expiryDate: new Date(value.expiryDate)
        });
      }
      console.log(`✅ Loaded ${activeSubscriptions.size} active subscriptions`);
    }

    // Load userHistory
    if (fs.existsSync(USER_HISTORY_FILE)) {
      const data = JSON.parse(fs.readFileSync(USER_HISTORY_FILE, 'utf8'));
      for (const [key, value] of Object.entries(data)) {
        userHistory.set(key, { ...value, lastCheck: new Date(value.lastCheck) });
      }
      console.log(`✅ Loaded ${userHistory.size} user history entries`);
    }

    console.log('✅ All persistent data loaded successfully');
  } catch (error) {
    console.error('❌ Error loading persistent data:', error.message);
  }
}

// Save data to JSON files
function saveData() {
  try {
    // Save pendingUsers
    const pendingData = Object.fromEntries(
      Array.from(pendingUsers.entries()).map(([key, value]) => [
        key,
        { ...value, timestamp: value.timestamp.toISOString() }
      ])
    );
    fs.writeFileSync(PENDING_USERS_FILE, JSON.stringify(pendingData, null, 2));

    // Save usedCodes
    fs.writeFileSync(USED_CODES_FILE, JSON.stringify(Array.from(usedCodes), null, 2));

    // Save activeSubscriptions
    const subscriptionsData = Object.fromEntries(
      Array.from(activeSubscriptions.entries()).map(([key, value]) => [
        key,
        {
          ...value,
          startDate: value.startDate.toISOString(),
          expiryDate: value.expiryDate.toISOString()
        }
      ])
    );
    fs.writeFileSync(ACTIVE_SUBSCRIPTIONS_FILE, JSON.stringify(subscriptionsData, null, 2));

    // Save userHistory
    const historyData = Object.fromEntries(
      Array.from(userHistory.entries()).map(([key, value]) => [
        key,
        { ...value, lastCheck: value.lastCheck.toISOString() }
      ])
    );
    fs.writeFileSync(USER_HISTORY_FILE, JSON.stringify(historyData, null, 2));

    console.log('💾 Persistent data saved successfully');
  } catch (error) {
    console.error('❌ Error saving persistent data:', error.message);
  }
}

// Load access codes from file or environment
let validCodes = new Set([
  '6030285',
  '5944993',
  '6890822',
  '5315470',
  '5985464',
  '5543615',
  '4527126',
  '4063502',
  '6743159',
  '6499052',
  '5782971',
  '5990854',
  '5729398',
  '4450584',
  '4729039',
  '4377560',
  '6952228',
  '4897168',
  '6568963',
  '5686050',
  '1697057',
  '3944692',
  '1783397',
  '1023462',
  '0769358',
  '2986177',
  '3706326',
  '2296568',
  '3209129',
  '2487276'
]);

// Load additional codes from environment variable
if (process.env.ACCESS_CODES) {
  const envCodes = process.env.ACCESS_CODES.split(',').map(code => code.trim());
  envCodes.forEach(code => validCodes.add(code));
}

// Group links
const GROUP_LINKS = {
  daily: 'https://t.me/+esRJpV1hEbRiMGRk',
  monthly: 'https://t.me/+9ihp-XFoRbRhZTJk',
  yearly: 'https://t.me/+6sf0IBhU2CZmM2U0'
};

// Group chat IDs (you need to get these from your groups)
const GROUP_CHAT_IDS = {
  daily: process.env.DAILY_GROUP_ID || '-1002919393985', // Daily VVIP Group
  monthly: process.env.MONTHLY_GROUP_ID || '-1002773588959', // Monthly VVIP Group
  yearly: process.env.YEARLY_GROUP_ID || '-1003091457695' // Yearly VVIP Group
};

// Subscription durations in milliseconds
const SUBSCRIPTION_DURATIONS = {
  daily: 24 * 60 * 60 * 1000, // 24 hours
  monthly: 30 * 24 * 60 * 60 * 1000, // 30 days
  yearly: 365 * 24 * 60 * 60 * 1000 // 365 days
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

// Handle /getchatid command (for getting group chat IDs)
bot.onText(/\/getchatid/, (msg) => {
  const chatId = msg.chat.id;
  const chatType = msg.chat.type;
  const chatTitle = msg.chat.title || 'Private Chat';

  if (chatType === 'group' || chatType === 'supergroup') {
    bot.sendMessage(chatId,
      `🆔 *Group Chat ID Information*\n\n` +
      `📋 *Chat Title:* ${chatTitle}\n` +
      `🆔 *Chat ID:* \`${chatId}\`\n` +
      `📝 *Type:* ${chatType}\n\n` +
      `💡 *Copy this Chat ID and add it to your Railway environment variables:*\n` +
      `\`CHAT_ID = ${chatId}\``, {
      parse_mode: 'Markdown'
    }).catch(error => {
      log('error', 'Failed to send chat ID message', { chatId, error: error.message });
    });
  } else {
    bot.sendMessage(chatId,
      `❌ *This command only works in groups!*\n\n` +
      `📝 Send /getchatid in your VVIP groups to get their Chat IDs.\n` +
      `🆔 You'll need these IDs for the Railway environment variables.`, {
      parse_mode: 'Markdown'
    }).catch(error => {
      log('error', 'Failed to send chat ID error message', { chatId, error: error.message });
    });
  }
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
• /getchatid - Get group chat ID (admin only)

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

  // Update user history
  const history = userHistory.get(userId) || { lastStatus: 'none', lastCheck: new Date() };
  history.lastCheck = new Date();
  userHistory.set(userId, history);
  saveData();

  // Check if user has active subscription first
  const subscription = activeSubscriptions.get(userId);

  if (subscription) {
    history.lastStatus = 'active';
    userHistory.set(userId, history);
    saveData();

    const now = new Date();
    const isExpired = now > subscription.expiryDate;
    const timeLeft = subscription.expiryDate - now;
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

    if (isExpired) {
      bot.sendMessage(chatId,
        `📊 *Your Access Status*

👤 *User:* ${username}
❌ *Status:* Subscription expired
⏰ *Expired:* ${subscription.expiryDate.toLocaleString()}

💡 *To renew your access:*
Visit our website and purchase a new subscription.

🎯 Ready to get premium access again?`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🛒 Renew VVIP Access', url: 'https://www.dhronepredicts.com/vvip' }]
          ]
        }
      }).catch(error => {
        log('error', 'Failed to send expired status message', { chatId, error: error.message });
      });
    } else {
      bot.sendMessage(chatId,
        `📊 *Your Access Status*

👤 *User:* ${username}
🎯 *Plan:* ${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} VVIP
⏰ *Expires:* ${subscription.expiryDate.toLocaleString()}
📅 *Days Left:* ${daysLeft}

✅ *Status:* Active subscription

🚀 Your premium group access is still valid!`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔗 Go to Group', url: GROUP_LINKS[subscription.plan] }]
          ]
        }
      }).catch(error => {
        log('error', 'Failed to send active status message', { chatId, error: error.message });
      });
    }
  } else {
    // Check if user has pending access (code validated but hasn't joined group yet)
    const pendingUser = pendingUsers.get(userId);

    if (pendingUser) {
      history.lastStatus = 'pending';
      userHistory.set(userId, history);
      saveData();

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
      history.lastStatus = 'none';
      userHistory.set(userId, history);
      saveData();

      // User has no subscription or pending access
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

  // Check if this is one of our premium groups using GROUP_CHAT_IDS
  const isPremiumGroup = Object.values(GROUP_CHAT_IDS).includes(chatId);

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
          `🎉 Welcome ${username} to the ${userData.plan.charAt(0).toUpperCase() + userData.plan.slice(1)} VVIP Group!

📊 Enjoy exclusive premium predictions and insights!
💬 Feel free to ask questions and engage with the community.`, {
          parse_mode: 'Markdown'
        });

        // Notify admin
        await notifyAdmin(userData, username);

        // Clean up
        pendingUsers.delete(userId);
        usedCodes.add(userData.code);
        saveData();

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

    // Update user history
    userHistory.set(userId, {
      lastStatus: 'pending',
      lastCheck: new Date(),
      lastCode: code,
      lastPlan: plan
    });

    // Also store subscription info for expiry tracking
    const expiryDate = new Date(Date.now() + SUBSCRIPTION_DURATIONS[plan]);
    activeSubscriptions.set(userId, {
      plan: plan,
      startDate: new Date(),
      expiryDate: expiryDate,
      username: username,
      code: code
    });

    saveData();

    // Try to automatically add user to group
    const groupId = GROUP_CHAT_IDS[plan];

    try {
      // Automatically add user to the group
      await bot.approveChatJoinRequest(groupId, userId);

      // Send welcome message in the group
      await bot.sendMessage(groupId,
        `🎉 Welcome ${username} to the ${plan.charAt(0).toUpperCase() + plan.slice(1)} VVIP Group!

📊 Enjoy exclusive premium predictions and insights!
💬 Feel free to ask questions and engage with the community.`, {
        parse_mode: 'Markdown'
      });

      // Send confirmation message to user
      await bot.sendMessage(chatId,
        `✅ *Access Code Validated & Added to Group!*

🎯 *Plan:* ${plan.charAt(0).toUpperCase() + plan.slice(1)} VVIP
🔢 *Code:* ${code}
⏰ *Expires:* ${new Date(Date.now() + SUBSCRIPTION_DURATIONS[plan]).toLocaleString()}

🚀 *You've been automatically added to your premium group!*
Check your group membership and enjoy premium predictions!`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔗 Visit Group', url: GROUP_LINKS[plan] }],
            [{ text: '📊 Check Status', callback_data: 'status' }]
          ]
        }
      });

      // Notify admin
      await notifyAdmin({ plan: plan, code: code }, username);

    } catch (error) {
      log('error', 'Error adding user to group automatically', { username, plan, error: error.message });

      // Fallback: send link if auto-add fails
      await bot.sendMessage(chatId,
        `✅ *Access Code Validated!*

🎯 *Plan:* ${plan.charAt(0).toUpperCase() + plan.slice(1)} VVIP
🔢 *Code:* ${code}

🚀 *Click below to join your premium group:*
The bot will approve your membership when you join.`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: `🚀 Join ${plan.charAt(0).toUpperCase() + plan.slice(1)} VVIP Group`, url: GROUP_LINKS[plan] }],
            [{ text: '🔄 Generate New Code', url: 'https://www.dhronepredicts.com' }]
          ]
        }
      });
    }

    // Mark code as used
    usedCodes.add(code);
    saveData();

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

// Bot initialization will be handled by server.js

// Automatic expiry check and user removal
function checkExpiredSubscriptions() {
  const now = new Date();
  const expiredUsers = [];

  for (const [userId, subscription] of activeSubscriptions) {
    if (now > subscription.expiryDate) {
      expiredUsers.push({ userId, subscription });
    }
  }

  // Remove expired users from groups
  expiredUsers.forEach(async ({ userId, subscription }) => {
    const groupChatId = GROUP_CHAT_IDS[subscription.plan];

    try {
      // Remove user from group
      await bot.banChatMember(groupChatId, userId);
      await bot.unbanChatMember(groupChatId, userId); // Unban immediately

      // Send notification to user
      await bot.sendMessage(userId,
        `⏰ *Your VVIP Subscription Has Expired!*

👤 *User:* ${subscription.username}
🎯 *Plan:* ${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} VVIP
⏰ *Expired:* ${subscription.expiryDate.toLocaleString()}

❌ *Access Removed:* You have been removed from the premium group.

💡 *To renew your access:*
Visit our website and purchase a new subscription.

🎯 Ready to get premium access again?`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🛒 Renew VVIP Access', url: 'https://www.dhronepredicts.com/vvip' }]
          ]
        }
      });

      // Notify admin
      await bot.sendMessage(ADMIN_USER_ID,
        `⏰ *VVIP Subscription Expired - User Removed*

👤 *User:* ${subscription.username}
🆔 *User ID:* ${userId}
🎯 *Plan:* ${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} VVIP
⏰ *Expired:* ${subscription.expiryDate.toLocaleString()}

✅ *Action:* User removed from group`, {
        parse_mode: 'Markdown'
      });

      // Clean up subscription
      activeSubscriptions.delete(userId);
      saveData();

      log('info', `Expired user ${subscription.username} removed from ${subscription.plan} group`, { userId });

    } catch (error) {
      log('error', `Failed to remove expired user ${subscription.username}`, { userId, error: error.message });
    }
  });

  // Log summary
  if (expiredUsers.length > 0) {
    log('info', `Expiry check completed: ${expiredUsers.length} users removed`);
  }
}

// Run expiry check every 5 minutes
setInterval(checkExpiredSubscriptions, 5 * 60 * 1000);

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

  // Load persistent data
  loadData();

  // Only validate token if we have proper environment variables
  if (BOT_TOKEN && ADMIN_USER_ID && BOT_TOKEN.includes(':')) {
    try {
      const isTokenValid = await validateBotToken();
      if (isTokenValid) {
        console.log('✅ Bot token validated successfully');

        // Bot will auto-poll since polling: true is set
        console.log('🔄 Bot polling enabled automatically');
      } else {
        console.error('❌ Bot token validation failed');
        console.error('🔧 Please check BOT_TOKEN in Railway environment variables');
      }
    } catch (error) {
      console.error('❌ Error during bot initialization:', error.message);
      console.error('🔧 Please check your environment variables and bot token');
    }
  } else {
    console.log('⚠️ Environment variables not configured properly');
    console.log('🔧 Please set BOT_TOKEN and ADMIN_USER_ID in Railway');
  }

  console.log('✅ Bot initialization completed');
  console.log('📊 Bot will continue running even with configuration issues');
}

// Bot initialization will be handled by server.js

// Handle uncaught exceptions (don't exit to keep HTTP server running)
process.on('uncaughtException', (error) => {
  console.error('💀 Uncaught exception:', error.message);
  console.error('🔄 HTTP server will continue running');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💀 Unhandled rejection:', reason.toString());
  console.error('🔄 HTTP server will continue running');
});

module.exports = { bot, pendingUsers, usedCodes, validCodes, activeSubscriptions, startBot };