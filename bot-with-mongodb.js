const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const db = require('./database');

// Load configuration from environment variables (Railway-friendly)
const BOT_TOKEN = process.env.BOT_TOKEN || '8284449243:AAGIVO5aVfo1LAcQ29wXxHJoY3Pq4QqVOZ0';
const ADMIN_USER_ID = process.env.ADMIN_USER_ID || '83222398921';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configuration validation
let configValid = true;
const configErrors = [];

if (!BOT_TOKEN) {
  configErrors.push('BOT_TOKEN is missing');
  configValid = false;
} else if (!BOT_TOKEN.includes(':')) {
  configErrors.push('BOT_TOKEN format is invalid');
  configValid = false;
}

if (!ADMIN_USER_ID) {
  configErrors.push('ADMIN_USER_ID is missing');
  configValid = false;
} else if (!/^\d+$/.test(ADMIN_USER_ID)) {
  configErrors.push('ADMIN_USER_ID must be a numeric user ID');
  configValid = false;
}

console.log('🔧 Configuration Check:');
if (configValid) {
  console.log('✅ BOT_TOKEN format validated');
  console.log('✅ ADMIN_USER_ID validated');
  console.log('✅ All required configuration is valid');
} else {
  console.error('❌ Configuration errors found:');
  configErrors.forEach(error => console.error(`   - ${error}`));
  console.error('🔧 Please fix these in Railway environment variables before deploying');
}

if (!configValid) {
  console.error('🚨 Cannot start bot due to configuration errors');
  console.error('📋 Please set proper environment variables in Railway dashboard');
}

// Initialize bot with production settings
let bot = null;
let botInitialized = false;

const botOptions = {
  polling: true,
  filepath: false
};

if (NODE_ENV === 'production') {
  botOptions.request = {
    timeout: 30000
  };
}

if (configValid) {
  try {
    bot = new TelegramBot(BOT_TOKEN, botOptions);
    botInitialized = true;
    console.log('✅ Telegram bot instance created successfully');
  } catch (error) {
    console.error('❌ Failed to create bot instance:', error.message);
    console.error('🔧 Please check your BOT_TOKEN and try again');
  }
} else {
  console.error('❌ Skipping bot initialization due to configuration errors');
}

// Create Express server for Railway health checks
const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    config: {
      botTokenValid: !!BOT_TOKEN,
      botTokenFormat: BOT_TOKEN && BOT_TOKEN.includes(':') ? 'valid' : 'invalid',
      adminUserIdValid: !!ADMIN_USER_ID,
      configurationValid: configValid
    },
    bot: {
      initialized: botInitialized,
      polling: bot && bot.isPolling ? bot.isPolling() : false,
      state: currentPollingState,
      retryCount: pollingRetryCount
    },
    database: {
      connected: databaseConnected,
      status: databaseConnected ? 'connected' : 'disconnected'
    }
  };

  res.status(200).json(healthData);
});

// Basic root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Dhrone Predictions Bot is running',
    status: 'active',
    timestamp: new Date().toISOString(),
    database: databaseConnected ? 'connected' : 'disconnected'
  });
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`🌐 HTTP server listening on port ${PORT}`);
  console.log(`🔗 Health check available at: http://localhost:${PORT}/health`);
});

// MongoDB Database Integration
let databaseConnected = false;

// Initialize database connection
async function initializeDatabase() {
  try {
    await db.connectToDatabase();
    databaseConnected = true;
    console.log('✅ Database connection established');
    await loadInitialData();
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    console.error('🔧 Bot will continue running but data will not be persisted');
    databaseConnected = false;
  }
}

// Load initial data from MongoDB
async function loadInitialData() {
  try {
    // Load access codes from database
    const unusedCodes = await db.codes.getUnusedCodes();
    const usedCodesData = await db.codes.getUsedCodes();
    
    unusedCodes.forEach(codeDoc => validCodes.add(codeDoc.code));
    usedCodesData.forEach(codeDoc => usedCodes.add(codeDoc.code));
    
    console.log(`✅ Loaded ${validCodes.size} total access codes from database`);
    console.log(`✅ Loaded ${usedCodes.size} used codes from database`);
    
    // Load active subscriptions
    const activeSubs = await db.subscriptions.getAllActiveSubscriptions();
    activeSubs.forEach(sub => {
      activeSubscriptions.set(sub.userId, {
        plan: sub.plan,
        startDate: sub.startDate,
        expiryDate: sub.expiryDate,
        username: sub.username,
        code: sub.code
      });
    });
    
    console.log(`✅ Loaded ${activeSubscriptions.size} active subscriptions from database`);
    
  } catch (error) {
    console.error('❌ Error loading initial data:', error.message);
  }
}

// Database helper functions
const databaseHelper = {
  async saveUser(userId, username, firstName, lastName) {
    if (!databaseConnected) return;
    try {
      await db.users.createOrUpdateUser({ userId, username, firstName, lastName });
    } catch (error) {
      console.error('Error saving user:', error.message);
    }
  },
  
  async saveSubscription(userId, plan, code, expiryDate, username) {
    if (!databaseConnected) return;
    try {
      await db.subscriptions.createSubscription({ userId, plan, code, expiryDate, username });
      activeSubscriptions.set(userId, {
        plan,
        startDate: new Date(),
        expiryDate: new Date(expiryDate),
        username,
        code
      });
    } catch (error) {
      console.error('Error saving subscription:', error.message);
    }
  },
  
  async markCodeAsUsed(code, userId) {
    if (!databaseConnected) return;
    try {
      await db.codes.markCodeAsUsed(code, userId);
      usedCodes.add(code);
    } catch (error) {
      console.error('Error marking code as used:', error.message);
    }
  },
  
  async updateUserHistory(userId, historyData) {
    if (!databaseConnected) return;
    try {
      await db.history.updateUserHistory(userId, historyData);
    } catch (error) {
      console.error('Error updating user history:', error.message);
    }
  },
  
  async getActiveSubscription(userId) {
    if (!databaseConnected) return null;
    try {
      return await db.subscriptions.getActiveSubscription(userId);
    } catch (error) {
      console.error('Error getting active subscription:', error.message);
      return null;
    }
  },
  
  async getExpiredSubscriptions() {
    if (!databaseConnected) return [];
    try {
      return await db.subscriptions.getExpiredSubscriptions();
    } catch (error) {
      console.error('Error getting expired subscriptions:', error.message);
      return [];
    }
  },
  
  async deactivateSubscription(userId) {
    if (!databaseConnected) return;
    try {
      await db.subscriptions.deactivateSubscription(userId);
      activeSubscriptions.delete(userId);
    } catch (error) {
      console.error('Error deactivating subscription:', error.message);
    }
  },
  
  async updateUserActivity(userId) {
    if (!databaseConnected) return;
    try {
      await db.users.updateUserActivity(userId);
    } catch (error) {
      console.error('Error updating user activity:', error.message);
    }
  }
};

// Data structures
const pendingUsers = new Map();
const usedCodes = new Set(['1697057', '3944692']);
const activeSubscriptions = new Map();
const userHistory = new Map();

// Access codes
let validCodes = new Set([
  '6030285', '5944993', '6890822', '5315470', '5985464',
  '5543615', '4527126', '4063502', '6743159', '6499052',
  '5782971', '5990854', '5729398', '4450584', '4729039',
  '4377560', '6952228', '4897168', '6568963', '5686050',
  '1697057', '3944692', '1783397', '1023462', '0769358',
  '2986177', '3706326', '2296568', '3209129', '2487276'
]);

// Group configuration
const GROUP_LINKS = {
  daily: 'https://t.me/+esRJpV1hEbRiMGRk',
  monthly: 'https://t.me/+9ihp-XFoRbRhZTJk',
  yearly: 'https://t.me/+6sf0IBhU2CZmM2U0'
};

const GROUP_CHAT_IDS = {
  daily: process.env.DAILY_GROUP_ID || '-1002919393985',
  monthly: process.env.MONTHLY_GROUP_ID || '-1002773588959',
  yearly: process.env.YEARLY_GROUP_ID || '-1003091457695'
};

const SUBSCRIPTION_DURATIONS = {
  daily: 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
  yearly: 365 * 24 * 60 * 60 * 1000
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

  if (NODE_ENV === 'production' && level === 'error' && !message.includes('Polling error')) {
    bot.sendMessage(ADMIN_USER_ID, `🚨 Bot Error: ${message}`).catch(() => {
      console.log('Failed to send error message to admin');
    });
  }
}

// Bot command handlers
if (bot && botInitialized) {
  // Handle /start command
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name;

    log('info', `User ${username} (${userId}) sent /start`);

    await databaseHelper.saveUser(userId, username, msg.from.first_name, msg.from.last_name);
    await databaseHelper.updateUserActivity(userId);

    bot.sendMessage(chatId,
      `👋 Welcome to Dhrone Predictions VVIP Access Bot!

🎯 To join our premium Telegram groups:

1️⃣ Get your 7-digit access code from our website after payment
2️⃣ Send me your access code
3️⃣ I'll validate it and add you to the appropriate group

💡 Send your access code now:`, {
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
      `🆘 Dhrone Predictions VVIP Access Bot - Help

🤖 Available Commands:
• /start - Welcome message and instructions
• /help - Show this help message
• /status - Check your access status

📋 How to Use:
1️⃣ Pay for VVIP access on our website
2️⃣ Get your unique 7-digit access code
3️⃣ Send the code to me (e.g., 1234567)
4️⃣ I'll automatically add you to the appropriate VVIP group

🎯 Subscription Plans:
• Daily VVIP - ₵50 (24 hours)
• Monthly VVIP - ₵350 (30 days)
• Yearly VVIP - ₵1750 (365 days)

❓ Need Help?
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
  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name;

    const history = userHistory.get(userId) || { lastStatus: 'none', lastCheck: new Date() };
    history.lastCheck = new Date();
    userHistory.set(userId, history);
    databaseHelper.updateUserHistory(userId, history);

    const subscription = await databaseHelper.getActiveSubscription(userId);

    if (subscription) {
      history.lastStatus = 'active';
      userHistory.set(userId, history);
      databaseHelper.updateUserHistory(userId, history);

      const now = new Date();
      const isExpired = now > subscription.expiryDate;
      const timeLeft = subscription.expiryDate - now;
      const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

      if (isExpired) {
        bot.sendMessage(chatId,
          `📊 Your Access Status

👤 User: ${username}
❌ Status: Subscription expired
⏰ Expired: ${subscription.expiryDate.toLocaleString()}

💡 To renew your access:
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
          `📊 Your Access Status

👤 User: ${username}
🎯 Plan: ${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} VVIP
⏰ Expires: ${subscription.expiryDate.toLocaleString()}
📅 Days Left: ${daysLeft}

✅ Status: Active subscription

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
      const pendingUser = pendingUsers.get(userId);

      if (pendingUser) {
        history.lastStatus = 'pending';
        userHistory.set(userId, history);
        databaseHelper.updateUserHistory(userId, history);

        bot.sendMessage(chatId,
          `📊 Your Access Status

👤 User: ${username}
🎯 Plan: ${pendingUser.plan.charAt(0).toUpperCase() + pendingUser.plan.slice(1)} VVIP
🔢 Code: ${pendingUser.code}
⏰ Validated: ${pendingUser.timestamp.toLocaleString()}

✅ Status: Code validated, ready to join group!

🚀 Click below to join your premium group:`, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🚀 Join ' + pendingUser.plan.charAt(0).toUpperCase() + pendingUser.plan.slice(1) + ' VVIP Group', url: GROUP_LINKS[pendingUser.plan] }]
            ]
          }
        }).catch(error => {
          log('error', 'Failed to send status message', { chatId, error: error.message });
        });
      } else {
        history.lastStatus = 'none';
        userHistory.set(userId, history);
        databaseHelper.updateUserHistory(userId, history);

        const totalCodes = validCodes.size;
        const usedCodesCount = usedCodes.size;
        const availableCodes = totalCodes - usedCodesCount;

        bot.sendMessage(chatId,
          `📊 Your Access Status

👤 User: ${username}
❌ Status: No active access code

📈 System Stats:
• Total codes available: ${totalCodes}
• Codes used: ${usedCodesCount}
• Codes remaining: ${availableCodes}

💡 To get access:
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

    if (text && text.startsWith('/')) return;
    if (msg.chat.type !== 'private') return;

    if (/^\d{7}$/.test(text)) {
      await handleAccessCode(chatId, userId, username, text);
    } else if (text && text.length > 0) {
      bot.sendMessage(chatId,
        `❌ Invalid format!

Please send your 7-digit access code (e.g., 1234567)

💡 Get your code from our website after payment.`, {
        parse_mode: 'Markdown'
      }).catch(error => {
        log('error', 'Failed to send invalid format message', { chatId, error: error.message });
      });
    }
  });

  // Handle new chat members
  bot.on('new_chat_members', async (msg) => {
    const chatId = msg.chat.id;
    const newMembers = msg.new_chat_members;

    const isPremiumGroup = Object.values(GROUP_CHAT_IDS).includes(chatId);
    if (!isPremiumGroup) return;

    for (const member of newMembers) {
      if (member.is_bot) continue;

      const userId = member.id;
      const username = member.username || member.first_name;

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

          await notifyAdmin(userData, username);

          pendingUsers.delete(userId);
          if (!usedCodes.has(userData.code)) {
            usedCodes.add(userData.code);
            await databaseHelper.markCodeAsUsed(userData.code, userId);
            log('info', `Code ${userData.code} marked as used after successful group join`, { username });
          }

          log('info', `User ${username} successfully added to ${userData.plan} group`);

        } catch (error) {
          log('error', 'Error adding user to group', { username, plan: userData.plan, error: error.message });
          await bot.sendMessage(chatId,
            `⚠️ There was an issue adding ${username}. Please contact support.`
          ).catch(() => {});
        }
      } else {
        await bot.sendMessage(chatId,
          `🚫 @${username}, you need a valid access code to join this group.

💡 Get your code from our website: https://www.dhronepredicts.com
🤖 Then message me (@${bot.username}) with your code.`, {
          parse_mode: 'Markdown'
        });

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

  // Handle callback queries
  bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;

    if (query.data === 'help') {
      bot.answerCallbackQuery(query.id);
      bot.sendMessage(chatId, 'Need help? Visit our website: https://www.dhronepredicts.com/contact');
    }
  });
} else {
  console.log('⚠️ Bot not initialized, skipping command handlers setup');
}

// Handle access code validation
async function handleAccessCode(chatId, userId, username, code) {
  try {
    log('info', `Processing access code from ${username}`, { code, userId });

    await databaseHelper.saveUser(userId, username, 'Unknown', 'Unknown');

    if (!validCodes.has(code)) {
      log('warn', `Invalid access code attempted: ${code} by ${username}`);
      return bot.sendMessage(chatId,
        `❌ Invalid Access Code!

The code "${code}" is not valid or has expired.

💡 Please check your code and try again, or get a new one from our website.`, {
        parse_mode: 'Markdown'
      });
    }

    if (usedCodes.has(code)) {
      log('warn', `Used access code attempted: ${code} by ${username}`);
      return bot.sendMessage(chatId,
        `❌ Code Already Used!

The code "${code}" has already been used.

💡 Each code can only be used once. Get a new code from our website.`, {
        parse_mode: 'Markdown'
      });
    }

    const plan = determinePlanFromCode(code);

    pendingUsers.set(userId, {
      code: code,
      plan: plan,
      timestamp: new Date(),
      username: username
    });

    const historyData = {
      lastStatus: 'pending',
      lastCheck: new Date(),
      lastCode: code,
      lastPlan: plan
    };
    userHistory.set(userId, historyData);
    databaseHelper.updateUserHistory(userId, historyData);

    const expiryDate = new Date(Date.now() + SUBSCRIPTION_DURATIONS[plan]);
    await databaseHelper.saveSubscription(userId, plan, code, expiryDate, username);

    await databaseHelper.markCodeAsUsed(code, userId);

    const groupId = GROUP_CHAT_IDS[plan];

    try {
      await bot.approveChatJoinRequest(groupId, userId, { hide_author: false });
      
      await bot.sendMessage(groupId,
        `🎉 Welcome ${username} to the ${plan.charAt(0).toUpperCase() + plan.slice(1)} VVIP Group!

📊 Enjoy exclusive premium predictions and insights!
💬 Feel free to ask questions and engage with the community.`, {
        parse_mode: 'Markdown'
      });

      await bot.sendMessage(chatId,
        `✅ Access Code Validated & Added to Group!

🎯 Plan: ${plan.charAt(0).toUpperCase() + plan.slice(1)} VVIP
🔢 Code: ${code}
⏰ Expires: ${new Date(Date.now() + SUBSCRIPTION_DURATIONS[plan]).toLocaleString()}

🚀 You've been automatically added to your premium group!
Check your group membership and enjoy premium predictions!`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔗 Visit Group', url: GROUP_LINKS[plan] }],
            [{ text: '📊 Check Status', callback_data: 'status' }]
          ]
        }
      });

      await notifyAdmin({ plan: plan, code: code, method: 'direct_add' }, username);

      log('info', `Access code validated for ${username}`, { code, plan, userId });

    } catch (error) {
      log('error', 'Error adding user to group', { username, plan, error: error.message });

      await bot.sendMessage(chatId,
        `✅ Access Code Validated!

🎯 Plan: ${plan.charAt(0).toUpperCase() + plan.slice(1)} VVIP
🔢 Code: ${code}

⚠️ There was an issue adding you to the group automatically.
Please try joining manually or contact support.`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 Join ' + plan.charAt(0).toUpperCase() + plan.slice(1) + ' VVIP Group', url: GROUP_LINKS[plan] }],
            [{ text: '📞 Contact Support', url: 'https://www.dhronepredicts.com/contact' }]
          ]
        }
      });

      await notifyAdmin({ plan: plan, code: code, method: 'error', error: error.message }, username);
    }

  } catch (error) {
    log('error', 'Error handling access code', { code, username, error: error.message });
    bot.sendMessage(chatId,
      `❌ Error processing your request

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
    let message =
      `🎉 New VVIP Member Added!

👤 User: ${username}
🎯 Plan: ${userData.plan.charAt(0).toUpperCase() + userData.plan.slice(1)}
🔢 Code: ${userData.code}
⏰ Time: ${new Date().toLocaleString()}`;

    if (userData.method === 'direct_add') {
      message += `\n\n✅ Direct Addition: User was automatically added to group`;
    } else if (userData.method === 'invite_link') {
      message += `\n\n🔗 Invite Link Sent: User received personal invite link`;
    } else if (userData.method === 'public_link') {
      message += `\n\n🌐 Public Link Sent: User received public group link`;
    } else if (userData.method === 'error') {
      message += `\n\n❌ Error: ${userData.error}`;
    }

    await bot.sendMessage(ADMIN_USER_ID, message, { parse_mode: 'Markdown' });
    log('info', `Admin notified about new member: ${username}`, { plan: userData.plan, method: userData.method });
  } catch (error) {
    log('error', 'Error notifying admin', { username, error: error.message });
  }
}

// Automatic expiry check and user removal
async function checkExpiredSubscriptions() {
  const expiredSubscriptions = await databaseHelper.getExpiredSubscriptions();
  
  for (const subscription of expiredSubscriptions) {
    const userId = subscription.userId;
    const groupChatId = GROUP_CHAT_IDS[subscription.plan];

    try {
      log('info', `Processing expired subscription for user ${subscription.username}`, { userId, plan: subscription.plan });

      let chatMember;
      try {
        chatMember = await bot.getChatMember(groupChatId, userId);
      } catch (error) {
        log('warn', `Could not check membership for ${subscription.username}, assuming not in group`, { userId, error: error.message });
        chatMember = { status: 'left' };
      }

      if (chatMember.status !== 'left' && chatMember.status !== 'kicked' && chatMember.status !== 'banned') {
        try {
          await bot.banChatMember(groupChatId, userId, { revoke_messages: false });
          await new Promise(resolve => setTimeout(resolve, 1000));
          await bot.unbanChatMember(groupChatId, userId);

          log('info', `Successfully removed expired user ${subscription.username} from ${subscription.plan} group`, { userId });
        } catch (banError) {
          log('error', `Failed to ban/unban expired user ${subscription.username}`, { userId, error: banError.message });
        }
      } else {
        log('info', `Expired user ${subscription.username} already left ${subscription.plan} group`, { userId });
      }

      try {
        await bot.sendMessage(userId,
          `⏰ Your VVIP Subscription Has Expired!

👤 User: ${subscription.username}
🎯 Plan: ${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} VVIP
⏰ Expired: ${subscription.expiryDate.toLocaleString()}

❌ Access Removed: You have been removed from the premium group.

💡 To renew your access:
Visit our website and purchase a new subscription.

🎯 Ready to get premium access again?`, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🛒 Renew VVIP Access', url: 'https://www.dhronepredicts.com/vvip' }]
            ]
          }
        });
        log('info', `Expiry notification sent to ${subscription.username}`, { userId });
      } catch (notifyError) {
        log('warn', `Could not send expiry notification to ${subscription.username}`, { userId, error: notifyError.message });
      }

      try {
        await bot.sendMessage(ADMIN_USER_ID,
          `⏰ VVIP Subscription Expired - User Removed

👤 User: ${subscription.username}
🆔 User ID: ${userId}
🎯 Plan: ${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} VVIP
⏰ Expired: ${subscription.expiryDate.toLocaleString()}

✅ Action: User removed from group`, {
          parse_mode: 'Markdown'
        });
        log('info', `Admin notified about expired user ${subscription.username}`, { userId });
      } catch (adminError) {
        log('warn', `Could not send admin notification for expired user ${subscription.username}`, { userId, error: adminError.message });
      }

      await databaseHelper.deactivateSubscription(userId);

      log('info', `Expired user ${subscription.username} processed and removed from ${subscription.plan} group`, { userId });

      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      log('error', `Failed to process expired user ${subscription.username}`, { userId, error: error.message });
    }
  }

  if (expiredSubscriptions.length > 0) {
    log('info', `Expiry check completed: ${expiredSubscriptions.length} users processed`);
  }
}

// Run expiry check every 5 minutes
setInterval(() => {
  checkExpiredSubscriptions().catch(error => {
    log('error', 'Error during expiry check', { error: error.message });
  });
}, 5 * 60 * 1000);

// Also run expiry check on startup
setTimeout(() => {
  checkExpiredSubscriptions().catch(error => {
    log('error', 'Error during startup expiry check', { error: error.message });
  });
}, 30000);

// Enhanced error handling with retry mechanism
let pollingRetryCount = 0;
const MAX_POLLING_RETRIES = 5;
const POLLING_RETRY_DELAY = 10000;
let = 'stopped';

if (bot && botInitialized) {
  bot.on('polling_error', (error) => {
    pollingRetryCount++;
    currentPollingState = 'error';
    console.error(`🚨 POLLING ERROR #${pollingRetryCount}:`, error.message);
    console.error('Error code:', error.code);

    if (error.code === 'ETELEGRAM' && error.message.includes('409')) {
      console.error('🚨 MULTIPLE BOT INSTANCES DETECTED!');
      console.error('💡 This means another instance of the bot is running');
      console.error('🔧 Solution: Stop the other bot instance or check Railway deployment');
      console.error('🔄 Stopping this instance to prevent conflicts...');
      currentPollingState = 'stopped';
      bot.stopPolling();
      return;
    }

    if (error.code === 'EFATAL') {
      console.error('💀 FATAL ERROR: Bot token may be invalid or bot is blocked');
      console.error('🔄 Stopping polling to prevent spam...');
      currentPollingState = 'stopped';
      bot.stopPolling();
      return;
    }

    if (pollingRetryCount < MAX_POLLING_RETRIES) {
      console.log(`⏳ Retrying in ${POLLING_RETRY_DELAY / 1000} seconds... (${pollingRetryCount}/${MAX_POLLING_RETRIES})`);
      setTimeout(() => {
        console.log('🔄 Attempting to restart polling...');
        currentPollingState = 'retrying';
        bot.startPolling().then(() => {
          currentPollingState = 'active';
          console.log('✅ Polling restarted successfully');
        }).catch(retryError => {
          console.error('❌ Retry failed:', retryError.message);
          currentPollingState = 'error';
        });
      }, POLLING_RETRY_DELAY);
    } else {
      console.error('💀 MAX RETRIES REACHED: Giving up on polling');
      console.error('💡 Please check your BOT_TOKEN and network connectivity');
      currentPollingState = 'stopped';
      bot.stopPolling();
    }

    log('error', 'Polling error occurred', {
      error: error.message,
      code: error.code,
      retryCount: pollingRetryCount
    });
  });

  bot.on('error', (error) => {
    console.error('🚨 BOT ERROR:', error.message);
    log('error', 'Bot error occurred', { error: error.message });
  });
} else {
  console.log('⚠️ Bot not initialized, skipping error handlers setup');
}

// Graceful shutdown
process.on('SIGINT', async () => {
  log('info', 'Received SIGINT, shutting down gracefully');
  if (bot) bot.stopPolling();
  await db.closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log('info', 'Received SIGTERM, shutting down gracefully');
  if (bot) bot.stopPolling();
  await db.closeConnection();
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
    return false;
  }
}

// Enhanced bot initialization
async function startBot() {
  console.log('🤖 Dhrone Predictions Telegram Bot Starting...');
  console.log(`📅 Environment: ${NODE_ENV}`);
  console.log(`🔢 Total access codes loaded: ${validCodes.size}`);
  console.log(`👤 Admin User ID: ${ADMIN_USER_ID}`);

  await initializeDatabase();

  if (!configValid) {
    console.error('❌ Skipping bot operations due to configuration errors');
    console.log('💡 Fix the configuration errors listed above to enable bot functionality');
    return;
  }

  try {
    const isTokenValid = await validateBotToken();
    if (!isTokenValid) {
      console.error('❌ Bot token validation failed');
      console.error('🔧 Please check BOT_TOKEN in Railway environment variables');
      return;
    }

    console.log('✅ Bot token validated successfully');

    if (bot && botInitialized) {
      try {
        if (!bot.isPolling()) {
          console.log('🔄 Starting bot polling...');
          await bot.startPolling();
          currentPollingState = 'active';
        } else {
          console.log('✅ Bot polling is already active');
          currentPollingState = 'active';
        }
        
        console.log('✅ Bot polling enabled successfully');
        console.log('🎉 Bot is now ready to receive messages!');
        
        try {
          await bot.sendMessage(ADMIN_USER_ID,
            '🤖 **Bot Status Update**\n\n✅ Bot successfully started and is now running!\n\n' +
            `📅 Environment: ${NODE_ENV}\n` +
            `⏰ Started: ${new Date().toLocaleString()}\n` +
            `🗄️ Database: ${databaseConnected ? 'Connected' : 'Disconnected'}\n\n` +
            'The bot is ready to process access codes and manage VVIP memberships.',
            { parse_mode: 'Markdown' }
          );
        } catch (notifyError) {
          console.log('⚠️ Could not send startup notification to admin:', notifyError.message);
        }
        
      } catch (pollingError) {
        console.error('❌ Failed to start polling:', pollingError.message);
        currentPollingState = 'error';
      }
    } else {
      console.error('❌ Bot instance not available for polling');
    }

  } catch (error) {
    console.error('❌ Error during bot initialization:', error.message);
    console.error('🔧 Please check your environment variables and bot token');
  }

  console.log('✅ Bot initialization completed');
}

// Initialize bot when module is loaded
startBot();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💀 Uncaught exception:', error.message);
  console.error('🔄 Bot will attempt to continue running');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💀 Unhandled rejection:', reason.toString());
  console.error('🔄 Bot will attempt to continue running');
});

// Keep-alive mechanism for Railway
setInterval(() => {
  console.log(`🔄 Bot keep-alive check - Uptime: ${Math.floor(process.uptime())}s`);
}, 300000);

module.exports = { bot, pendingUsers, usedCodes, validCodes, activeSubscriptions, startBot, app };