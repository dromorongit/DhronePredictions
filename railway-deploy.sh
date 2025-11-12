#!/bin/bash

# Railway Deployment Script for Dhrone Predictions Bot
# This script sets up environment variables and deploys the bot properly

set -e  # Exit on any error

echo "🚀 Dhrone Predictions Bot - Railway Deployment Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "bot-production.js" ]; then
    print_error "bot-production.js not found!"
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "✅ Project directory verified"

# Check if railway CLI is installed
print_step "Checking Railway CLI..."
if ! command -v railway &> /dev/null; then
    print_warning "Railway CLI not found"
    print_status "Installing Railway CLI..."
    npm install -g @railway/cli
    if [ $? -eq 0 ]; then
        print_status "✅ Railway CLI installed successfully"
    else
        print_error "Failed to install Railway CLI"
        print_error "Please install manually: npm install -g @railway/cli"
        exit 1
    fi
else
    print_status "✅ Railway CLI is already installed"
fi

# Login to Railway (if not already logged in)
print_step "Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    print_status "Logging into Railway..."
    railway login
    if [ $? -ne 0 ]; then
        print_error "Failed to login to Railway"
        print_error "Please login manually and run this script again"
        exit 1
    fi
    print_status "✅ Successfully logged into Railway"
else
    print_status "✅ Already logged into Railway"
fi

# Set environment variables
print_step "Setting up environment variables..."

# Required environment variables
REQUIRED_VARS=(
    "BOT_TOKEN=8284449243:AAGIVO5aVfo1LAcQ29wXxHJoY3Pq4QqVOZ0"
    "ADMIN_USER_ID=83222398921"
    "NODE_ENV=production"
    "PORT=3000"
)

# Optional environment variables
OPTIONAL_VARS=(
    "DAILY_GROUP_ID=-1002919393985"
    "MONTHLY_GROUP_ID=-1002773588959"
    "YEARLY_GROUP_ID=-1003091457695"
)

# Set required variables
for var in "${REQUIRED_VARS[@]}"; do
    var_name=$(echo $var | cut -d'=' -f1)
    var_value=$(echo $var | cut -d'=' -f2-)
    
    print_status "Setting $var_name..."
    railway variables set "$var_name=$var_value"
    if [ $? -eq 0 ]; then
        print_status "✅ $var_name set successfully"
    else
        print_error "❌ Failed to set $var_name"
    fi
done

# Set optional variables (these might already be set)
print_status "Setting optional environment variables..."
for var in "${OPTIONAL_VARS[@]}"; do
    var_name=$(echo $var | cut -d'=' -f1)
    var_value=$(echo $var | cut -d'=' -f2-)
    
    print_status "Setting $var_name (optional)..."
    railway variables set "$var_name=$var_value"
    if [ $? -eq 0 ]; then
        print_status "✅ $var_name set successfully"
    else
        print_warning "⚠️ Failed to set $var_name (this is optional)"
    fi
done

# Verify environment variables
print_step "Verifying environment variables..."
railway variables list

# Deploy to Railway
print_step "Deploying bot to Railway..."

# First, make sure we're in the correct project
print_status "Checking current Railway project..."
current_project=$(railway status --json 2>/dev/null | grep -o '"projectId":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$current_project" ]; then
    print_error "No Railway project found"
    print_error "Please run 'railway link' to link to your project first"
    exit 1
fi

print_status "✅ Connected to Railway project: $current_project"

# Deploy using Railway CLI
print_status "Starting deployment..."
railway up

if [ $? -eq 0 ]; then
    print_status "✅ Deployment initiated successfully!"
else
    print_error "❌ Deployment failed"
    print_error "Please check Railway dashboard for error details"
    exit 1
fi

# Wait for deployment to complete
print_status "Waiting for deployment to complete..."
sleep 10

# Check deployment status
print_step "Checking deployment status..."
railway status

# Get deployment URL
print_step "Getting deployment information..."
deployment_info=$(railway status --json 2>/dev/null)

if [ $? -eq 0 ]; then
    print_status "✅ Deployment status retrieved"
    
    # Extract URL if available
    url=$(echo $deployment_info | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ ! -z "$url" ]; then
        print_status "🌐 Bot deployment URL: https://$url"
        print_status "📊 Health check: https://$url/health"
    fi
else
    print_warning "Could not retrieve deployment status automatically"
fi

# Test the deployment
print_step "Testing bot deployment..."

# Wait a bit for the bot to start
sleep 15

# Test health endpoint
if [ ! -z "$url" ]; then
    health_url="https://$url/health"
    print_status "Testing health endpoint: $health_url"
    
    if command -v curl &> /dev/null; then
        health_response=$(curl -s "$health_url")
        if [ $? -eq 0 ]; then
            print_status "✅ Health check successful!"
            print_status "Response: $health_response"
        else
            print_warning "⚠️ Health check failed"
            print_warning "The bot might still be starting up"
        fi
    else
        print_warning "curl not available, skipping health check"
        print_warning "You can manually test: curl https://$url/health"
    fi
fi

# Final instructions
echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
print_status "Your bot has been deployed to Railway!"
print_status "Next steps:"
echo ""
echo "1. 🌐 Check Railway Dashboard: https://railway.app/dashboard"
echo "2. 📊 Monitor logs in Railway dashboard for:"
echo "   ✅ 'Bot token validated successfully'"
echo "   ✅ 'Bot polling enabled automatically'"
echo "   ✅ 'Bot is now ready to receive messages!'"
echo ""
echo "3. 🤖 Test your bot on Telegram:"
echo "   - Message: @dhronepredictionsbot"
echo "   - Send: /start"
echo "   - Should receive welcome message immediately"
echo ""
echo "4. 🔍 If bot doesn't respond:"
echo "   - Check Railway logs for errors"
echo "   - Verify environment variables are set correctly"
echo "   - Ensure bot token is valid"
echo ""
echo "📋 Environment Variables Set:"
for var in "${REQUIRED_VARS[@]}"; do
    var_name=$(echo $var | cut -d'=' -f1)
    echo "   ✅ $var_name"
done

echo ""
print_status "Deployment script completed successfully! 🚀"

# Save deployment info to file
cat > deployment-info.txt << EOF
Railway Deployment Information
=============================
Project ID: $current_project
Deployment Time: $(date)
Environment: Production

Environment Variables Set:
$(railway variables list 2>/dev/null || echo "Run 'railway variables list' to see current variables")

Next Steps:
1. Check Railway dashboard for deployment status
2. Monitor logs for successful bot initialization
3. Test bot on Telegram with /start command
4. Monitor bot health at /health endpoint

If issues occur:
1. Check Railway logs for error messages
2. Verify all environment variables are set
3. Ensure BOT_TOKEN is valid and bot is active
4. Check for multiple bot instance conflicts
EOF

print_status "Deployment info saved to deployment-info.txt"
print_status "Check this file for deployment details and troubleshooting info"