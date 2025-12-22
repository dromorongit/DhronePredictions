#!/bin/bash

# MongoDB Integration Deployment Script
# This script deploys both the Telegram bot and user API to Railway

echo "🚀 Starting MongoDB Integration Deployment..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed. Please install it first:"
    echo "   npm install -g @railway/cli"
    echo "   Then run: railway login"
    exit 1
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "❌ Please login to Railway first:"
    echo "   railway login"
    exit 1
fi

echo "✅ Railway CLI is installed and user is logged in"

# Install dependencies
echo "📦 Installing dependencies..."
npm install mongodb bcryptjs jsonwebtoken express cors dotenv morgan

# Set up environment variables
echo "⚙️ Setting up environment variables..."
echo "Please ensure you have these environment variables set in Railway:"
echo "MONGODB_URL=mongodb://mongo:wYzKHjSeLJOZJywivAbLzFXcjexLusLV@mongodb.railway.internal:27017"
echo "JWT_SECRET=your-super-secret-jwt-key-change-this-in-production"
echo "TELEGRAM_BOT_TOKEN=your-telegram-bot-token"
echo ""

# Deploy the User API
echo "🌐 Deploying User API to Railway..."
railway up user-api.js
echo "✅ User API deployed!"

# Deploy the Telegram Bot
echo "🤖 Deploying Telegram Bot to Railway..."
railway up bot-with-mongodb.js
echo "✅ Telegram Bot deployed!"

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Update the API base URL in all HTML files:"
echo "   this.apiBase = 'https://your-app.railway.app/api'"
echo ""
echo "2. Test the API endpoints:"
echo "   curl https://your-app.railway.app/api/health"
echo ""
echo "3. Test user registration:"
echo "   Visit your website and test the registration form"
echo ""
echo "4. Test Telegram bot:"
echo "   Send /start to your bot on Telegram"
echo ""
echo "📖 For detailed setup instructions, see:"
echo "   MONGODB_COMPLETE_INTEGRATION_GUIDE.md"
echo ""
echo "🔧 To view logs:"
echo "   railway logs"
echo ""
echo "🌍 To open your app:"
echo "   railway open"