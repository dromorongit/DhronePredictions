# 🤖 Telegram Bot Setup Guide for Dhrone Predictions VVIP Access

This guide will help you set up a Telegram bot that automatically manages access to your premium VVIP groups using unique access codes.

## 📋 Prerequisites

- Node.js installed (v14 or higher)
- A Telegram account
- Your website deployed and accessible

## 🚀 Step-by-Step Setup

### Step 1: Create Your Telegram Bot

1. **Message @BotFather**
   - Open Telegram and search for `@BotFather`
   - Send `/newbot` command
   - Follow the prompts to create your bot
   - Save the **API Token** (it looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

2. **Get Your Telegram User ID**
   - Message `@userinfobot` in Telegram
   - Send any message
   - Save your **User ID** (a number like: `123456789`)

### Step 2: Set Up Your Premium Groups

1. **Create Private Groups**
   - Create 3 private groups in Telegram:
     - `Dhrone Daily VVIP`
     - `Dhrone Monthly VVIP`
     - `Dhrone Yearly VVIP`

2. **Add Bot as Administrator**
   - Add your bot to each group
   - Make it an **Administrator** with these permissions:
     - ✅ Delete messages
     - ✅ Ban users
     - ✅ Add users
     - ✅ Manage chat

3. **Get Group Links**
   - Go to each group's settings
   - Generate an invite link
   - Save the links (they look like: `https://t.me/+AbCdEfGhIjKlMnOpQr`)

### Step 3: Configure the Bot

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **✅ CONFIGURED - telegram-bot.js**
   ```javascript
   // ✅ Already configured with your real values:
   const BOT_TOKEN = '8284449243:AAFUhi2-GkVbb4Lp3Or_SbBsREnCUaTaPls';  // From @BotFather
   const ADMIN_USER_ID = '5872136698';                                    // From @userinfobot

   const GROUP_LINKS = {
     daily: 'https://t.me/+ZE_XiWcVZmU2YTA0',
     monthly: 'https://t.me/+9ihp-XFoRbRhZTJk',
     yearly: 'https://t.me/+6sf0IBhU2CZmM2U0'
   };
   ```

3. **Add Your Access Codes**
   ```javascript
   const validCodes = new Set([
     '1234567',
     '7654321',
     '1111111',
     // Add all your generated codes here
   ]);
   ```

### Step 4: Update Your Website

1. **Edit scripts.js**
   ```javascript
   const telegramLinks = {
     daily: 'https://t.me/+YOUR_DAILY_GROUP_LINK',
     monthly: 'https://t.me/+YOUR_MONTHLY_GROUP_LINK',
     yearly: 'https://t.me/+YOUR_YEARLY_GROUP_LINK'
   };
   ```

2. **Update Website URL**
   ```javascript
   // In telegram-bot.js
   [{ text: '🔗 Visit Website', url: 'https://yourwebsite.com' }]
   ```

## 🎯 How the Bot Works

### Available Commands:
- `/start` - Welcome message and instructions
- `/help` - Show help and available commands
- `/status` - Check your access status and system stats

### User Flow:
1. **User pays** → Gets 7-digit access code
2. **User sends `/start`** → Bot explains the process
3. **User sends access code** → Bot validates it
4. **Bot provides group link** → User clicks to join
5. **Bot detects new member** → Automatically approves valid users
6. **User gets access** → Welcome message in group

### Bot Features:
- ✅ **Access Code Validation** - Checks 7-digit codes
- ✅ **One-Time Use** - Each code can only be used once
- ✅ **Plan-Specific Groups** - Different groups for Daily/Monthly/Yearly
- ✅ **Automatic Approval** - No manual intervention needed
- ✅ **Admin Notifications** - Get notified of new members
- ✅ **Error Handling** - Graceful handling of invalid attempts
- ✅ **Help Command** - `/help` for user assistance
- ✅ **Status Command** - `/status` to check access status
- ✅ **Interactive Menus** - Inline buttons for better UX

## 🛠️ Running the Bot

### Development Mode:
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

### PM2 (Recommended for production):
```bash
npm install -g pm2
pm2 start telegram-bot.js --name "dhrone-bot"
pm2 save
pm2 startup
```

## 📊 Monitoring & Management

### Check Bot Status:
```bash
# View logs
pm2 logs dhrone-bot

# Restart bot
pm2 restart dhrone-bot

# Stop bot
pm2 stop dhrone-bot
```

### Admin Commands:
- The bot will send you notifications for each new member
- Monitor the console for any errors
- Check `pendingUsers` and `usedCodes` for debugging

## 🔧 Customization Options

### Change Code Pattern Logic:
```javascript
function determinePlanFromCode(code) {
  const firstDigit = parseInt(code.charAt(0));

  if (firstDigit <= 3) return 'daily';
  if (firstDigit <= 6) return 'monthly';
  return 'yearly';
}
```

### Add More Plans:
```javascript
const GROUP_LINKS = {
  daily: 'https://t.me/+...',
  weekly: 'https://t.me/+...',
  monthly: 'https://t.me/+...',
  yearly: 'https://t.me/+...'
};
```

### Custom Welcome Messages:
```javascript
await bot.sendMessage(chatId,
  `🎉 Welcome ${username} to the ${userData.plan} VVIP Group!\n\n` +
  `📊 Enjoy exclusive premium predictions!\n` +
  `💬 Ask questions and engage with the community.`, {
  parse_mode: 'Markdown'
});
```

## 🚨 Security Considerations

1. **Keep Bot Token Secure**
   - Never share your bot token
   - Use environment variables in production

2. **Access Code Management**
   - Generate unique codes for each user
   - Codes expire after use
   - Monitor for suspicious activity

3. **Group Security**
   - Keep groups private
   - Bot has admin privileges for access control
   - Regular monitoring of group activity

## 🐛 Troubleshooting

### Bot Not Responding:
```bash
# Check if bot is running
pm2 status

# Check logs
pm2 logs dhrone-bot

# Restart bot
pm2 restart dhrone-bot
```

### Users Can't Join:
1. Check if bot is administrator in the group
2. Verify group links are correct
3. Check if access codes are added to `validCodes`
4. Check bot logs for errors

### Common Issues:
- **"Bot is not an administrator"** → Make bot admin in group
- **"Invalid access code"** → Add code to `validCodes` set
- **"Code already used"** → Codes are one-time use only

## 📈 Scaling & Production

### For High Traffic:
1. **Use a Database** instead of in-memory storage
2. **Deploy on VPS** (DigitalOcean, AWS, etc.)
3. **Use PM2** for process management
4. **Set up monitoring** (health checks, error logging)
5. **Backup access codes** regularly

### Environment Variables:
```bash
# Create .env file
BOT_TOKEN=your_bot_token
ADMIN_USER_ID=your_telegram_id
NODE_ENV=production
```

## 🎉 Success Metrics

Track these to measure success:
- ✅ **New member notifications** from bot
- ✅ **Group member count** increases
- ✅ **Payment conversions** to group joins
- ✅ **User engagement** in premium groups

## 📞 Support

If you encounter issues:
1. Check the bot logs: `pm2 logs dhrone-bot`
2. Verify all configuration values
3. Test with a known working access code
4. Check Telegram Bot API status

---

**🎊 Your Telegram bot is now ready to automatically manage premium group access!**

**Users will have a seamless experience from payment to premium content access.** 🚀