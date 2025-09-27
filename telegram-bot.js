const TelegramBot = require('node-telegram-bot-api');

// Replace with your bot token from @BotFather
const BOT_TOKEN = '8284449243:AAGIVO5aVfo1LAcQ29wXxHJoY3Pq4QqVOZ0';

// Replace with your Telegram user ID (get this by messaging @userinfobot)
const ADMIN_USER_ID = '5872136698';

// Initialize bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Store pending users (in production, use a database)
const pendingUsers = new Map();
const usedCodes = new Set();

// Replace with your actual group chat IDs
const GROUP_LINKS = {
  daily: 'https://t.me/+ZE_XiWcVZmU2YTA0',
  monthly: 'https://t.me/+9ihp-XFoRbRhZTJk',
  yearly: 'https://t.me/+6sf0IBhU2CZmM2U0'
};

// Valid access codes (in production, store in database)
const validCodes = new Set([
  // All access codes cleared - new codes will be generated through payment system
]);

console.log('🤖 Telegram Bot is running...');

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name;

  bot.sendMessage(chatId,
    `👋 *Welcome to Dhrone Predictions VVIP Access Bot!*\n\n` +
    `🎯 *To join our premium Telegram groups:*\n\n` +
    `1️⃣ Get your 7-digit access code from our website after payment\n` +
    `2️⃣ Send me your access code\n` +
    `3️⃣ I'll validate it and add you to the appropriate group\n\n` +
    `💡 *Send your access code now:*`, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔗 Visit Website', url: 'https://www.dhronepredicts.com' }]
      ]
    }
  });
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId,
    `🆘 *Dhrone Predictions VVIP Access Bot - Help*\n\n` +
    `🤖 *Available Commands:*\n` +
    `• /start - Welcome message and instructions\n` +
    `• /help - Show this help message\n` +
    `• /status - Check your access status\n\n` +
    `📋 *How to Use:*\n` +
    `1️⃣ Pay for VVIP access on our website\n` +
    `2️⃣ Get your unique 7-digit access code\n` +
    `3️⃣ Send the code to me (e.g., 1234567)\n` +
    `4️⃣ I'll validate it and give you group access\n\n` +
    `🎯 *Subscription Plans:*\n` +
    `• Daily VVIP - ₵50 (24 hours)\n` +
    `• Monthly VVIP - ₵350 (30 days)\n` +
    `• Yearly VVIP - ₵1750 (365 days)\n\n` +
    `❓ *Need Help?*\n` +
    `Contact our support team or visit our website.`, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔗 Visit Website', url: 'https://www.dhronepredicts.com' }],
        [{ text: '📞 Contact Support', url: 'https://www.dhronepredicts.com/contact' }]
      ]
    }
  });
});

// Handle /status command
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name;

  // Check if user has pending access
  const pendingUser = pendingUsers.get(userId);

  if (pendingUser) {
    // User has validated code but hasn't joined group yet
    bot.sendMessage(chatId,
      `📊 *Your Access Status*\n\n` +
      `👤 *User:* ${username}\n` +
      `🎯 *Plan:* ${pendingUser.plan.charAt(0).toUpperCase() + pendingUser.plan.slice(1)} VVIP\n` +
      `🔢 *Code:* ${pendingUser.code}\n` +
      `⏰ *Validated:* ${pendingUser.timestamp.toLocaleString()}\n\n` +
      `✅ *Status:* Code validated, ready to join group!\n\n` +
      `🚀 Click below to join your premium group:`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: `🚀 Join ${pendingUser.plan.charAt(0).toUpperCase() + pendingUser.plan.slice(1)} VVIP Group`, url: GROUP_LINKS[pendingUser.plan] }]
        ]
      }
    });
  } else {
    // User has no pending access
    const totalCodes = validCodes.size;
    const usedCodesCount = usedCodes.size;
    const availableCodes = totalCodes - usedCodesCount;

    bot.sendMessage(chatId,
      `📊 *Your Access Status*\n\n` +
      `👤 *User:* ${username}\n` +
      `❌ *Status:* No active access code\n\n` +
      `📈 *System Stats:*\n` +
      `• Total codes available: ${totalCodes}\n` +
      `• Codes used: ${usedCodesCount}\n` +
      `• Codes remaining: ${availableCodes}\n\n` +
      `💡 *To get access:*\n` +
      `1. Visit our website\n` +
      `2. Purchase a VVIP subscription\n` +
      `3. Get your 7-digit access code\n` +
      `4. Send it to me\n\n` +
      `🎯 Ready to get premium access?`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛒 Get VVIP Access', url: 'https://www.dhronepredicts.com/vvip' }],
          [{ text: '❓ Need Help?', callback_data: 'help' }]
        ]
      }
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
      `❌ *Invalid format!*\n\n` +
      `Please send your *7-digit access code* (e.g., 1234567)\n\n` +
      `💡 Get your code from our website after payment.`, {
      parse_mode: 'Markdown'
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

      // Add user to group
      try {
        await bot.approveChatJoinRequest(chatId, userId);
        await bot.sendMessage(chatId,
          `🎉 Welcome ${username} to the ${userData.plan} VVIP Group!\n\n` +
          `📊 Enjoy exclusive premium predictions and insights!\n` +
          `💬 Feel free to ask questions and engage with the community.`, {
          parse_mode: 'Markdown'
        });

        // Notify admin
        await notifyAdmin(userData, username);

        // Clean up
        pendingUsers.delete(userId);
        usedCodes.add(userData.code);

      } catch (error) {
        console.error('Error adding user to group:', error);
        await bot.sendMessage(chatId,
          `⚠️ There was an issue adding ${username}. Please contact support.`
        );
      }
    } else {
      // User joined without valid access code
      await bot.sendMessage(chatId,
        `🚫 @${username}, you need a valid access code to join this group.\n\n` +
        `💡 Get your code from our website: https://www.dhronepredicts.com\n` +
        `🤖 Then message me (@${bot.username}) with your code.`, {
        parse_mode: 'Markdown'
      });

      // Remove user from group
      try {
        await bot.banChatMember(chatId, userId);
        await bot.unbanChatMember(chatId, userId); // Unban immediately to allow rejoining
      } catch (error) {
        console.error('Error removing user:', error);
      }
    }
  }
});

// Handle access code validation
async function handleAccessCode(chatId, userId, username, code) {
  try {
    // Check if code is valid and not used
    if (!validCodes.has(code)) {
      return bot.sendMessage(chatId,
        `❌ *Invalid Access Code!*\n\n` +
        `The code "${code}" is not valid or has expired.\n\n` +
        `💡 Please check your code and try again, or get a new one from our website.`, {
        parse_mode: 'Markdown'
      });
    }

    if (usedCodes.has(code)) {
      return bot.sendMessage(chatId,
        `❌ *Code Already Used!*\n\n` +
        `The code "${code}" has already been used.\n\n` +
        `💡 Each code can only be used once. Get a new code from our website.`, {
        parse_mode: 'Markdown'
      });
    }

    // Determine which group based on code pattern (you can customize this logic)
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
      `✅ *Access Code Validated!*\n\n` +
      `🎯 *Plan:* ${plan.charAt(0).toUpperCase() + plan.slice(1)} VVIP\n` +
      `🔢 *Code:* ${code}\n\n` +
      `🚀 *Click below to join your premium group:*`, {
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

  } catch (error) {
    console.error('Error handling access code:', error);
    bot.sendMessage(chatId,
      `❌ *Error processing your request*\n\n` +
      `Please try again later or contact support.`
    );
  }
}

// Determine plan from code (customize this logic as needed)
function determinePlanFromCode(code) {
  // Example logic: you can customize this based on your code generation
  const firstDigit = parseInt(code.charAt(0));

  if (firstDigit <= 3) return 'daily';
  if (firstDigit <= 6) return 'monthly';
  return 'yearly';
}

// Notify admin about new user
async function notifyAdmin(userData, username) {
  try {
    const message =
      `🎉 *New VVIP Member Added!*\n\n` +
      `👤 *User:* ${username}\n` +
      `🎯 *Plan:* ${userData.plan.charAt(0).toUpperCase() + userData.plan.slice(1)}\n` +
      `🔢 *Code:* ${userData.code}\n` +
      `⏰ *Time:* ${new Date().toLocaleString()}`;

    await bot.sendMessage(ADMIN_USER_ID, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error notifying admin:', error);
  }
}

// Handle callback queries (for inline buttons)
bot.on('callback_query', (query) => {
  // Handle any callback queries if needed
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

bot.on('error', (error) => {
  console.error('Bot error:', error);
});

console.log('✅ Telegram Bot setup complete!');
console.log('📝 Don\'t forget to:');
console.log('   1. Replace BOT_TOKEN with your bot token');
console.log('   2. Replace ADMIN_USER_ID with your Telegram ID');
console.log('   3. Update GROUP_LINKS with your actual group links');
console.log('   4. Add your generated access codes to validCodes Set');