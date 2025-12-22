const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Load configuration from environment variables (Railway-friendly)
const BOT_TOKEN = process.env.BOT_TOKEN || '8284449243:AAGIVO5aVfo1LAcQ29wXxHJoY3Pq4QqVOZ0';
const ADMIN_USER_ID = process.env.ADMIN_USER_ID || '83222398921';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Enhanced configuration validation
let configValid = true;
const configErrors = [];

// Validate BOT_TOKEN format
if (!BOT_TOKEN) {
  configErrors.push('BOT_TOKEN is missing');
  configValid = false;
} else if (!BOT_TOKEN.includes(':')) {
  configErrors.push('BOT_TOKEN format is invalid. Expected format: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz');
  configValid = false;
}

// Validate ADMIN_USER_ID
if (!ADMIN_USER_ID) {
  configErrors.push('ADMIN_USER_ID is missing');
  configValid = false;
} else if (!/^\d+$/.test(ADMIN_USER_ID)) {
  configErrors.push('ADMIN_USER_ID must be a numeric user ID');
  configValid = false;
}

// Display configuration status
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

// Only proceed with bot initialization if config is valid
if (!configValid) {
  console.error('🚨 Cannot start bot due to configuration errors');
  console.error('📋 Please set proper environment variables in Railway dashboard');
  // Don't exit process - let the HTTP server still run for health checks
}

// Initialize bot with production settings
let bot = null;
let botInitialized = false;

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

// Only initialize bot if configuration is valid
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

// Enable CORS for GitHub Pages
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://dhronepredicts.com');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    
    next();
});

// Parse JSON bodies
app.use(express.json());

// In-memory storage for predictions (replace with database in production)
let predictions = [
    {
        _id: "694606e967d27881d721a500",
        id: "b3024716-093f-4469-94af-d70434f9a067",
        match: "NEC Nijmegen vs Ajax Amsterdam",
        leagueType: "Netherlands Eredivisie",
        prediction: "Over 2.5 Goals",
        odds: "1.44",
        probability: "50.74%",
        category: "vvip",
        date: "2025-12-20",
        time: "19:00",
        status: "Won",
        featured: false,
        note: "",
        createdAt: "2025-12-20T02:16:09.388Z",
        updatedAt: "2025-12-20T22:48:33.870Z",
        __v: 0
    },
    {
        _id: "6946063267d27881d721a4f9",
        id: "94032c5a-4946-42bb-a362-1ddb6138a658",
        match: "Manchester City vs West Ham United ",
        leagueType: "English Premier League ",
        prediction: "Over 2.5 Goals",
        odds: "1.36",
        probability: "70.42%",
        category: "vvip",
        date: "2025-12-20",
        time: "15:00",
        status: "Won",
        featured: false,
        note: "",
        createdAt: "2025-12-20T02:13:06.932Z",
        updatedAt: "2025-12-20T22:48:47.230Z",
        __v: 0
    }
];

// Enhanced health check endpoint for Railway
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
    data: {
      pendingUsers: pendingUsers.size,
      usedCodes: usedCodes.size,
      activeSubscriptions: activeSubscriptions.size,
      validCodes: validCodes.size
    }
  };

  res.status(200).json(healthData);
});

// Basic root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Dhrone Predictions Bot is running',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// VVIP Predictions API Endpoints

// Get all predictions with optional filtering
app.get('/api/predictions', (req, res) => {
  try {
    const { category, status } = req.query;
    let filteredPredictions = predictions;

    // Filter by category if provided
    if (category) {
      filteredPredictions = filteredPredictions.filter(p => p.category === category);
    }

    // Filter by status if provided
    if (status) {
      filteredPredictions = filteredPredictions.filter(p => p.status === status);
    }

    res.json(filteredPredictions);
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific prediction by ID
app.get('/api/predictions/:id', (req, res) => {
  try {
    const prediction = predictions.find(p => p.id === req.params.id);
    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }
    res.json(prediction);
  } catch (error) {
    console.error('Error fetching prediction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new prediction (for admin use)
app.post('/api/predictions', (req, res) => {
  try {
    const { match, leagueType, prediction, odds, probability, category, date, time, status = 'Pending' } = req.body;
    
    if (!match || !leagueType || !prediction || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newPrediction = {
      _id: `temp_${Date.now()}`,
      id: require('crypto').randomUUID(),
      match,
      leagueType,
      prediction,
      odds: odds || 'N/A',
      probability: probability || 'N/A',
      category,
      date: date || new Date().toISOString().split('T')[0],
      time: time || '00:00',
      status,
      featured: false,
      note: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      __v: 0
    };

    predictions.push(newPrediction);
    res.status(201).json(newPrediction);
  } catch (error) {
    console.error('Error creating prediction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update prediction status
app.put('/api/predictions/:id', (req, res) => {
  try {
    const predictionIndex = predictions.findIndex(p => p.id === req.params.id);
    if (predictionIndex === -1) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    const { status, score, note } = req.body;
    
    if (status) predictions[predictionIndex].status = status;
    if (score) predictions[predictionIndex].score = score;
    if (note !== undefined) predictions[predictionIndex].note = note;
    predictions[predictionIndex].updatedAt = new Date().toISOString();

    res.json(predictions[predictionIndex]);
  } catch (error) {
    console.error('Error updating prediction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete prediction
app.delete('/api/predictions/:id', (req, res) => {
  try {
    const predictionIndex = predictions.findIndex(p => p.id === req.params.id);
    if (predictionIndex === -1) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    predictions.splice(predictionIndex, 1);
    res.json({ message: 'Prediction deleted successfully' });
  } catch (error) {
    console.error('Error deleting prediction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`🌐 HTTP server listening on port ${PORT}`);
  console.log(`🔗 Health check available at: http://localhost:${PORT}/health`);
});

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
// Initialize usedCodes with known used codes
const usedCodes = new Set(['1697057', '3944692']);

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

// Load additional codes from environment variable (disabled for now)
// if (process.env.ACCESS_CODES) {
//   const envCodes = process.env.ACCESS_CODES.split(',').map(code => code.trim());
//   envCodes.forEach(code => validCodes.add(code));
// }

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

// Set up command handlers only if bot is initialized
if (bot && botInitialized) {
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

  // Handle /checkbotadmin command (for checking bot admin status)
  bot.onText(/\/checkbotadmin/, (msg) => {
    const chatId = msg.chat.id;
    const chatType = msg.chat.type;
    const chatTitle = msg.chat.title || 'Private Chat';

    if (chatType === 'group' || chatType === 'supergroup') {
      // Check if bot is admin in this group
      bot.getChatMember(chatId, bot.botInfo?.id || 0).then(member => {
        const isAdmin = ['administrator', 'creator'].includes(member.status);
        const canInvite = member.can_invite_users;
        const canRestrict = member.can_restrict_members;

        bot.sendMessage(chatId,
          `🤖 *Bot Admin Status Check*\n\n` +
          `📋 *Group:* ${chatTitle}\n` +
          `🆔 *Chat ID:* \`${chatId}\`\n\n` +
          `👑 *Bot is Admin:* ${isAdmin ? '✅ YES' : '❌ NO'}\n` +
          `👥 *Can Invite Users:* ${canInvite ? '✅ YES' : '❌ NO'}\n` +
          `🚫 *Can Restrict Members:* ${canRestrict ? '✅ YES' : '❌ NO'}\n\n` +
          `${!isAdmin ? '⚠️ *WARNING:* Bot needs admin rights to add users automatically!' : '✅ *Bot has required permissions for auto-addition!'}`, {
          parse_mode: 'Markdown'
        }).catch(error => {
          log('error', 'Failed to send bot admin check message', { chatId, error: error.message });
        });
      }).catch(error => {
        bot.sendMessage(chatId,
          `❌ *Could not check bot status in this group*\n\n` +
          `Make sure the bot is added to the group and try again.`, {
          parse_mode: 'Markdown'
        }).catch(() => {});
        log('error', 'Failed to check bot member status', { chatId, error: error.message });
      });
    } else {
      bot.sendMessage(chatId,
        `❌ *This command only works in groups!*\n\n` +
        `📝 Send /checkbotadmin in your VVIP groups to check bot permissions.`, {
        parse_mode: 'Markdown'
      }).catch(error => {
        log('error', 'Failed to send bot admin check error message', { chatId, error: error.message });
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
• /checkbotadmin - Check bot permissions in group (admin only)

📋 *How to Use:*
1️⃣ Pay for VVIP access on our website
2️⃣ Get your unique 7-digit access code
3️⃣ Send the code to me (e.g., 1234567)
4️⃣ I'll automatically add you to the appropriate VVIP group

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
          // Only mark code as used if it wasn't already marked during validation
          if (!usedCodes.has(userData.code)) {
            usedCodes.add(userData.code);
            log('info', `Code ${userData.code} marked as used after successful group join`, { username });
          }
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
} else {
  console.log('⚠️ Bot not initialized, skipping command handlers setup');
}

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

// Handle /checkbotadmin command (for checking bot admin status)
bot.onText(/\/checkbotadmin/, (msg) => {
  const chatId = msg.chat.id;
  const chatType = msg.chat.type;
  const chatTitle = msg.chat.title || 'Private Chat';

  if (chatType === 'group' || chatType === 'supergroup') {
    // Check if bot is admin in this group
    bot.getChatMember(chatId, bot.botInfo?.id || 0).then(member => {
      const isAdmin = ['administrator', 'creator'].includes(member.status);
      const canInvite = member.can_invite_users;
      const canRestrict = member.can_restrict_members;

      bot.sendMessage(chatId,
        `🤖 *Bot Admin Status Check*\n\n` +
        `📋 *Group:* ${chatTitle}\n` +
        `🆔 *Chat ID:* \`${chatId}\`\n\n` +
        `👑 *Bot is Admin:* ${isAdmin ? '✅ YES' : '❌ NO'}\n` +
        `👥 *Can Invite Users:* ${canInvite ? '✅ YES' : '❌ NO'}\n` +
        `🚫 *Can Restrict Members:* ${canRestrict ? '✅ YES' : '❌ NO'}\n\n` +
        `${!isAdmin ? '⚠️ *WARNING:* Bot needs admin rights to add users automatically!' : '✅ *Bot has required permissions for auto-addition!*'}`, {
        parse_mode: 'Markdown'
      }).catch(error => {
        log('error', 'Failed to send bot admin check message', { chatId, error: error.message });
      });
    }).catch(error => {
      bot.sendMessage(chatId,
        `❌ *Could not check bot status in this group*\n\n` +
        `Make sure the bot is added to the group and try again.`, {
        parse_mode: 'Markdown'
      }).catch(() => {});
      log('error', 'Failed to check bot member status', { chatId, error: error.message });
    });
  } else {
    bot.sendMessage(chatId,
      `❌ *This command only works in groups!*\n\n` +
      `📝 Send /checkbotadmin in your VVIP groups to check bot permissions.`, {
      parse_mode: 'Markdown'
    }).catch(error => {
      log('error', 'Failed to send bot admin check error message', { chatId, error: error.message });
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
• /checkbotadmin - Check bot permissions in group (admin only)

📋 *How to Use:*
1️⃣ Pay for VVIP access on our website
2️⃣ Get your unique 7-digit access code
3️⃣ Send the code to me (e.g., 1234567)
4️⃣ I'll automatically add you to the appropriate VVIP group

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
        // Only mark code as used if it wasn't already marked during validation
        if (!usedCodes.has(userData.code)) {
          usedCodes.add(userData.code);
          log('info', `Code ${userData.code} marked as used after successful group join`, { username });
        }
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

    // Directly add user to the appropriate group
    const groupId = GROUP_CHAT_IDS[plan];

    try {
      // Method 1: Try to add user directly using unbanChatMember (most reliable for private groups)
      try {
        // First unban to ensure clean state, then try to add
        await bot.unbanChatMember(groupId, userId, { only_if_banned: true });
        log('info', `Cleaned ban status for ${username}`, { plan });

        // Try to add user directly to the group
        await bot.approveChatJoinRequest(groupId, userId, { hide_author: false });
        log('info', `Successfully approved join request for ${username}`, { plan });

      } catch (directAddError) {
        log('warn', `Direct approval failed for ${username}, trying alternative method`, { error: directAddError.message });

        // Method 2: Try to unban and add via member management
        try {
          await bot.unbanChatMember(groupId, userId);
          // Wait a moment for unban to take effect
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Try to add as a regular member
          await bot.approveChatJoinRequest(groupId, userId, { hide_author: false });
          log('info', `Successfully added ${username} via unban method`, { plan });

        } catch (unbanError) {
          log('error', `All direct addition methods failed for ${username}`, { error: unbanError.message });

          // Method 3: Send invite link as last resort
          try {
            const invite = await bot.createChatInviteLink(groupId, {
              member_limit: 1,
              expire_date: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
              name: `VVIP Access for ${username}`
            });

            await bot.sendMessage(chatId,
              `✅ *Access Code Validated!*

🎯 *Plan:* ${plan.charAt(0).toUpperCase() + plan.slice(1)} VVIP
🔢 *Code:* ${code}
⏰ *Expires:* ${new Date(Date.now() + SUBSCRIPTION_DURATIONS[plan]).toLocaleString()}

🚀 *Click below to join your premium group:*
Your personal invite link (expires in 1 hour):`, {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: `🚀 Join ${plan.charAt(0).toUpperCase() + plan.slice(1)} VVIP Group`, url: invite.invite_link }],
                  [{ text: '📊 Check Status', callback_data: 'status' }]
                ]
              }
            });

            await notifyAdmin({ plan: plan, code: code, method: 'invite_link' }, username);
            return; // Exit here since we're using invite link

          } catch (inviteError) {
            log('error', `Even invite link failed for ${username}`, { error: inviteError.message });

            // Ultimate fallback: public group link
            await bot.sendMessage(chatId,
              `✅ *Access Code Validated!*

🎯 *Plan:* ${plan.charAt(0).toUpperCase() + plan.slice(1)} VVIP
🔢 *Code:* ${code}

🚀 *Click below to join your premium group:*
Please join using the public group link:`, {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: `🚀 Join ${plan.charAt(0).toUpperCase() + plan.slice(1)} VVIP Group`, url: GROUP_LINKS[plan] }],
                  [{ text: '📞 Contact Support', url: 'https://www.dhronepredicts.com/contact' }]
                ]
              }
            });

            await notifyAdmin({ plan: plan, code: code, method: 'public_link', error: 'all_methods_failed' }, username);
            return; // Exit here
          }
        }
      }

      // If we reach here, direct addition was successful
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
      await notifyAdmin({ plan: plan, code: code, method: 'direct_add' }, username);

    } catch (error) {
      log('error', 'Critical error in group addition process', { username, plan, error: error.message });

      // Send error message to user
      await bot.sendMessage(chatId,
        `✅ *Access Code Validated!*

🎯 *Plan:* ${plan.charAt(0).toUpperCase() + plan.slice(1)} VVIP
🔢 *Code:* ${code}

⚠️ *There was an issue adding you to the group automatically.*
Please try joining manually or contact support.`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: `🚀 Join ${plan.charAt(0).toUpperCase() + plan.slice(1)} VVIP Group`, url: GROUP_LINKS[plan] }],
            [{ text: '📞 Contact Support', url: 'https://www.dhronepredicts.com/contact' }]
          ]
        }
      });

      await notifyAdmin({ plan: plan, code: code, method: 'error', error: error.message }, username);
    }

    // Mark code as used (only if direct addition was successful)
    if (userData.method === 'direct_add') {
      usedCodes.add(code);
      saveData();
      log('info', `Code ${code} marked as used for successful direct addition`, { username });
    } else {
      log('warn', `Code ${code} NOT marked as used due to addition method: ${userData.method}`, { username });
      // For non-direct methods, mark as used after user actually joins via link
      // This will be handled in the new_chat_members event
    }

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
    let message =
      `🎉 *New VVIP Member Added!*

👤 *User:* ${username}
🎯 *Plan:* ${userData.plan.charAt(0).toUpperCase() + userData.plan.slice(1)}
🔢 *Code:* ${userData.code}
⏰ *Time:* ${new Date().toLocaleString()}`;

    if (userData.method === 'direct_add') {
      message += `\n\n✅ *Direct Addition:* User was automatically added to group`;
    } else if (userData.method === 'invite_link') {
      message += `\n\n🔗 *Invite Link Sent:* User received personal invite link`;
    } else if (userData.method === 'public_link') {
      message += `\n\n🌐 *Public Link Sent:* User received public group link`;
    } else if (userData.method === 'error') {
      message += `\n\n❌ *Error:* ${userData.error}`;
    }

    await bot.sendMessage(ADMIN_USER_ID, message, { parse_mode: 'Markdown' });
    log('info', `Admin notified about new member: ${username}`, { plan: userData.plan, method: userData.method });
  } catch (error) {
    log('error', 'Error notifying admin', { username, error: error.message });
  }
}

// Initialize bot independently if run directly

// Automatic expiry check and user removal
async function checkExpiredSubscriptions() {
  const now = new Date();
  const expiredUsers = [];

  for (const [userId, subscription] of activeSubscriptions) {
    if (now > subscription.expiryDate) {
      expiredUsers.push({ userId, subscription });
    }
  }

  // Process expired users sequentially to avoid rate limits
  for (const { userId, subscription } of expiredUsers) {
    const groupChatId = GROUP_CHAT_IDS[subscription.plan];

    try {
      log('info', `Processing expired subscription for user ${subscription.username}`, { userId, plan: subscription.plan });

      // Check if user is still in the group before trying to remove
      let chatMember;
      try {
        chatMember = await bot.getChatMember(groupChatId, userId);
      } catch (error) {
        // If we can't get chat member, assume user is not in group or group doesn't exist
        log('warn', `Could not check membership for ${subscription.username}, assuming not in group`, { userId, error: error.message });
        chatMember = { status: 'left' }; // Treat as left
      }

      if (chatMember.status !== 'left' && chatMember.status !== 'kicked' && chatMember.status !== 'banned') {
        // Remove user from group
        try {
          await bot.banChatMember(groupChatId, userId, { revoke_messages: false });
          // Wait a moment before unbanning to ensure ban takes effect
          await new Promise(resolve => setTimeout(resolve, 1000));
          await bot.unbanChatMember(groupChatId, userId);

          log('info', `Successfully removed expired user ${subscription.username} from ${subscription.plan} group`, { userId });
        } catch (banError) {
          log('error', `Failed to ban/unban expired user ${subscription.username}`, { userId, error: banError.message });
          // Continue with notifications even if removal failed
        }
      } else {
        log('info', `Expired user ${subscription.username} already left ${subscription.plan} group`, { userId });
      }

      // Send notification to user (always try this)
      try {
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
        log('info', `Expiry notification sent to ${subscription.username}`, { userId });
      } catch (notifyError) {
        log('warn', `Could not send expiry notification to ${subscription.username}`, { userId, error: notifyError.message });
      }

      // Notify admin
      try {
        await bot.sendMessage(ADMIN_USER_ID,
          `⏰ *VVIP Subscription Expired - User Removed*

👤 *User:* ${subscription.username}
🆔 *User ID:* ${userId}
🎯 *Plan:* ${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} VVIP
⏰ *Expired:* ${subscription.expiryDate.toLocaleString()}

✅ *Action:* User removed from group`, {
          parse_mode: 'Markdown'
        });
        log('info', `Admin notified about expired user ${subscription.username}`, { userId });
      } catch (adminError) {
        log('warn', `Could not send admin notification for expired user ${subscription.username}`, { userId, error: adminError.message });
      }

      // Clean up subscription
      activeSubscriptions.delete(userId);
      saveData();

      log('info', `Expired user ${subscription.username} processed and removed from ${subscription.plan} group`, { userId });

      // Add small delay between processing users to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      log('error', `Failed to process expired user ${subscription.username}`, { userId, error: error.message });
    }
  }

  // Log summary
  if (expiredUsers.length > 0) {
    log('info', `Expiry check completed: ${expiredUsers.length} users processed`);
  }
}

// Run expiry check every 5 minutes
setInterval(() => {
  checkExpiredSubscriptions().catch(error => {
    log('error', 'Error during expiry check', { error: error.message });
  });
}, 5 * 60 * 1000);

// Also run expiry check on startup (after a short delay to allow bot to initialize)
setTimeout(() => {
  checkExpiredSubscriptions().catch(error => {
    log('error', 'Error during startup expiry check', { error: error.message });
  });
}, 30000); // 30 seconds after startup

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

// Enhanced error handling with retry mechanism
let pollingRetryCount = 0;
const MAX_POLLING_RETRIES = 5;
const POLLING_RETRY_DELAY = 10000; // 10 seconds
let currentPollingState = 'stopped';

// Only set up error handlers if bot is initialized
if (bot && botInitialized) {
  bot.on('polling_error', (error) => {
    pollingRetryCount++;
    currentPollingState = 'error';
    console.error(`🚨 POLLING ERROR #${pollingRetryCount}:`, error.message);
    console.error('Error code:', error.code);
    console.error('Error response:', error.response?.body);

    // Handle multiple instance conflict specifically
    if (error.code === 'ETELEGRAM' && error.message.includes('409') && error.message.includes('terminated by other getUpdates request')) {
      console.error('🚨 MULTIPLE BOT INSTANCES DETECTED!');
      console.error('💡 This means another instance of the bot is running');
      console.error('🔧 Solution: Stop the other bot instance or check Railway deployment');
      console.error('🔄 Stopping this instance to prevent conflicts...');
      currentPollingState = 'stopped';
      bot.stopPolling();
      return;
    }

    // Provide specific error messages
    if (error.code === 'EFATAL') {
      console.error('💀 FATAL ERROR: Bot token may be invalid or bot is blocked');
      console.error('🔄 Stopping polling to prevent spam...');
      currentPollingState = 'stopped';
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
      response: error.response?.body,
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

// Enhanced bot initialization
async function startBot() {
  console.log('🤖 Dhrone Predictions Telegram Bot Starting...');
  console.log(`📅 Environment: ${NODE_ENV}`);
  console.log(`🔢 Total access codes loaded: ${validCodes.size}`);
  console.log(`👤 Admin User ID: ${ADMIN_USER_ID}`);

  // Load persistent data
  loadData();

  // Only proceed with bot operations if configuration is valid
  if (!configValid) {
    console.error('❌ Skipping bot operations due to configuration errors');
    console.log('💡 Fix the configuration errors listed above to enable bot functionality');
    return;
  }

  try {
    // Validate bot token first
    const isTokenValid = await validateBotToken();
    if (!isTokenValid) {
      console.error('❌ Bot token validation failed');
      console.error('🔧 Please check BOT_TOKEN in Railway environment variables');
      return;
    }

    console.log('✅ Bot token validated successfully');

    // Start polling (it should already be enabled, but let's ensure it)
    if (bot && botInitialized) {
      try {
        // Ensure bot is polling
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
        
        // Notify admin that bot is running
        try {
          await bot.sendMessage(ADMIN_USER_ID,
            '🤖 **Bot Status Update**\n\n✅ Bot successfully started and is now running!\n\n' +
            `📅 Environment: ${NODE_ENV}\n` +
            `⏰ Started: ${new Date().toLocaleString()}\n\n` +
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

// Handle uncaught exceptions (don't exit to keep HTTP server running)
process.on('uncaughtException', (error) => {
  console.error('💀 Uncaught exception:', error.message);
  console.error('🔄 Bot will attempt to continue running');
  // Don't exit process - keep the HTTP server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💀 Unhandled rejection:', reason.toString());
  console.error('🔄 Bot will attempt to continue running');
  // Don't exit process - keep the HTTP server running
});

// Keep-alive mechanism for Railway
setInterval(() => {
  console.log(`🔄 Bot keep-alive check - Uptime: ${Math.floor(process.uptime())}s`);
}, 300000); // Log every 5 minutes

module.exports = { bot, pendingUsers, usedCodes, validCodes, activeSubscriptions, startBot, app };
