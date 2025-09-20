# 🤖 Complete Telegram Bot Setup for Dhrone Predictions

## 📁 Files Created

| File | Purpose |
|------|---------|
| `telegram-bot.js` | Main bot application |
| `telegram-bot-package.json` | Bot dependencies |
| `generate-codes.js` | Access code generator |
| `test-bot.js` | Bot testing utilities |
| `TELEGRAM_BOT_SETUP.md` | Detailed setup guide |

## 🚀 Quick Start

### 1. Install Bot Dependencies
```bash
# Navigate to your project directory
cd /path/to/your/website

# Install bot dependencies (separate from website)
npm install --package-lock-only
npm ci
```

### 2. Generate Access Codes
```bash
# Generate 10 daily access codes
node generate-codes.js 10 daily

# Generate 5 monthly codes
node generate-codes.js 5 monthly

# Generate 3 yearly codes
node generate-codes.js 3 yearly
```

### 3. Configure Bot
Edit `telegram-bot.js`:
```javascript
const BOT_TOKEN = 'YOUR_BOT_TOKEN_FROM_BOTFATHER';
const ADMIN_USER_ID = 'YOUR_TELEGRAM_USER_ID';
```

### 4. Test Bot Logic
```bash
node test-bot.js
```

### 5. Run Bot
```bash
npm start
```

## 🎯 How It Works

### User Journey:
1. **Payment** → User pays for VVIP subscription
2. **Code Generation** → System generates unique 7-digit code
3. **Modal Display** → Beautiful modal shows code + Telegram link
4. **Bot Interaction** → User sends code to bot
5. **Validation** → Bot validates code and determines plan
6. **Group Access** → Bot provides appropriate group link
7. **Auto-Approval** → When user joins, bot automatically approves

### Bot Features:
- ✅ **7-digit access codes** (unique, one-time use)
- ✅ **Plan-specific groups** (Daily/Monthly/Yearly)
- ✅ **Automatic validation** (no manual approval needed)
- ✅ **Admin notifications** (get notified of new members)
- ✅ **Error handling** (graceful failure handling)
- ✅ **Security** (codes expire after use)

## 🔧 Configuration

### Required Setup:
1. **Bot Token** from @BotFather
2. **Admin User ID** from @userinfobot
3. **Private Telegram Groups** (one for each plan)
4. **Group Invite Links** (update in both bot and website)
5. **Access Codes** (generate and add to bot)

### Group Setup:
```
Daily VVIP:   https://t.me/+DAILY_GROUP_LINK
Monthly VVIP: https://t.me/+MONTHLY_GROUP_LINK
Yearly VVIP:  https://t.me/+YEARLY_GROUP_LINK
```

## 📊 Code Examples

### Generate Codes:
```bash
# Generate codes for different plans
node generate-codes.js 20 daily
node generate-codes.js 15 monthly
node generate-codes.js 10 yearly
```

### Test Bot:
```bash
# Run comprehensive tests
node test-bot.js
```

### Run Bot:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🔐 Security Features

- **One-time codes** - Each code can only be used once
- **Plan validation** - Codes are tied to specific subscription plans
- **Admin notifications** - Monitor all new member additions
- **Automatic cleanup** - Invalid attempts are handled gracefully
- **Group protection** - Unauthorized users are automatically removed

## 📈 Monitoring

### Check Bot Status:
```bash
# View running processes
pm2 status

# View bot logs
pm2 logs dhrone-bot

# Restart bot
pm2 restart dhrone-bot
```

### Admin Notifications:
- Bot sends you a message for each new approved member
- Includes username, plan type, and access code used
- Helps you track conversions and monitor activity

## 🛠️ Customization

### Change Plan Logic:
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

## 🎉 Success Flow

```
User Pays → Gets Code → Clicks Link → Sends Code to Bot
    ↓           ↓           ↓           ↓
 Modal Shows → Code: 1234567 → Joins Group → Bot Validates
    ↓           ↓           ↓           ↓
Copy Code → Telegram Opens → Code Accepted → Auto-Approved
    ↓           ↓           ↓           ↓
Welcome! ← Premium Access ← Group Joined ← Success!
```

## 📞 Support

### Common Issues:
- **Bot not responding** → Check token and internet connection
- **Users can't join** → Verify bot is group administrator
- **Invalid codes** → Add codes to `validCodes` set
- **Wrong group** → Check plan determination logic

### Debug Steps:
1. Check bot logs: `pm2 logs dhrone-bot`
2. Test with known working code
3. Verify group links are correct
4. Ensure bot has admin permissions

## 🚀 Production Deployment

### Recommended Setup:
1. **VPS Server** (DigitalOcean, AWS, Linode)
2. **PM2** for process management
3. **SSL Certificate** for secure connections
4. **Monitoring** (UptimeRobot, health checks)
5. **Backup** (regular code backups)

### PM2 Commands:
```bash
# Install PM2 globally
npm install -g pm2

# Start bot
pm2 start telegram-bot.js --name "dhrone-bot"

# Save process list
pm2 save

# Set up auto-start on server reboot
pm2 startup
```

## 📋 Checklist

### Pre-Launch:
- ✅ Bot token configured
- ✅ Admin user ID set
- ✅ Telegram groups created
- ✅ Bot added as administrator
- ✅ Group links updated
- ✅ Access codes generated
- ✅ Website URLs configured
- ✅ Bot tested locally

### Post-Launch:
- ✅ Monitor bot logs
- ✅ Check admin notifications
- ✅ Verify user flow works
- ✅ Monitor group member growth
- ✅ Generate new codes as needed

---

## 🎊 Ready to Launch!

Your Telegram bot is now fully configured to provide automated premium group access for your VVIP subscribers. Users will have a seamless experience from payment to premium content access!

**🚀 Happy botting!** 🤖✨