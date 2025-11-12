#!/bin/bash

# Bot Instance Manager for Dhrone Predictions Bot
# This script helps manage multiple bot instances and prevents conflicts

set -e

echo "🔧 Dhrone Predictions Bot - Instance Manager"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check for existing bot processes
check_bot_processes() {
    echo "🔍 Checking for existing bot processes..."
    
    # Check for Node.js processes running bot files
    local node_processes=$(ps aux | grep -E "node.*bot-production|node.*bot\.js" | grep -v grep || true)
    
    if [ ! -z "$node_processes" ]; then
        print_warning "Found running bot processes:"
        echo "$node_processes"
        return 0
    else
        print_status "No running bot processes found"
        return 1
    fi
}

# Function to stop all bot processes
stop_all_bot_processes() {
    print_step "Stopping all bot processes..."
    
    # Find and kill Node.js processes running bot files
    local pids=$(ps aux | grep -E "node.*bot-production|node.*bot\.js" | grep -v grep | awk '{print $2}' || true)
    
    if [ ! -z "$pids" ]; then
        for pid in $pids; do
            print_status "Stopping process: $pid"
            kill -TERM $pid 2>/dev/null || true
            sleep 2
            # Force kill if still running
            kill -KILL $pid 2>/dev/null || true
        done
        print_status "All bot processes stopped"
    else
        print_status "No bot processes to stop"
    fi
}

# Function to check Railway deployment status
check_railway_deployment() {
    print_step "Checking Railway deployment status..."
    
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI not found. Install with: npm install -g @railway/cli"
        return 1
    fi
    
    # Check if logged in
    if ! railway whoami &> /dev/null; then
        print_error "Not logged into Railway. Run: railway login"
        return 1
    fi
    
    # Get deployment status
    local status=$(railway status --json 2>/dev/null)
    if [ $? -eq 0 ]; then
        print_status "Railway deployment status retrieved"
        echo "$status" | head -20
    else
        print_error "Could not retrieve Railway status"
        return 1
    fi
}

# Function to restart Railway deployment
restart_railway_deployment() {
    print_step "Restarting Railway deployment..."
    
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI not found"
        return 1
    fi
    
    # Redeploy
    print_status "Initiating new deployment..."
    railway up
    
    if [ $? -eq 0 ]; then
        print_status "✅ Deployment restarted successfully!"
    else
        print_error "❌ Deployment restart failed"
        return 1
    fi
}

# Function to check bot responsiveness
check_bot_responsiveness() {
    print_step "Checking bot responsiveness..."
    
    local bot_username="dhronepredictionsbot"
    print_status "Testing bot: @$bot_username"
    
    # This would require actual Telegram API call
    # For now, we'll check Railway health endpoint if available
    local railway_status=$(railway status --json 2>/dev/null)
    local url=$(echo "$railway_status" | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ ! -z "$url" ]; then
        local health_url="https://$url/health"
        print_status "Testing health endpoint: $health_url"
        
        if command -v curl &> /dev/null; then
            local response=$(curl -s "$health_url" --max-time 10)
            if [ $? -eq 0 ]; then
                print_status "✅ Health check successful!"
                echo "$response" | jq '.' 2>/dev/null || echo "$response"
            else
                print_warning "⚠️ Health check failed or timed out"
            fi
        else
            print_warning "curl not available, skipping HTTP health check"
        fi
    else
        print_warning "Could not determine deployment URL"
    fi
}

# Function to clear Railway deployments
clear_railway_deployments() {
    print_step "Clearing Railway deployments..."
    
    print_warning "This will remove old deployments and restart fresh"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # This would typically require Railway CLI commands
        # For now, we'll suggest manual approach
        print_status "Please go to Railway Dashboard → Deployments → Delete old deployments manually"
        print_status "Then run: railway up"
    else
        print_status "Operation cancelled"
    fi
}

# Function to show bot logs
show_bot_logs() {
    print_step "Showing recent bot logs..."
    
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI not found"
        return 1
    fi
    
    print_status "Showing last 50 lines of logs..."
    railway logs --tail 50
}

# Function to diagnose common issues
diagnose_issues() {
    print_step "Diagnosing common bot issues..."
    
    echo "🔍 Running diagnostics..."
    echo
    
    # Check 1: Bot token validity
    print_status "Check 1: Testing bot token..."
    node -e "
        const TelegramBot = require('node-telegram-bot-api');
        const bot = new TelegramBot(process.env.BOT_TOKEN || '8284449243:AAGIVO5aVfo1LAcQ29wXxHJoY3Pq4QqVOZ0', {polling: false});
        bot.getMe().then(info => {
            console.log('✅ Bot token is valid');
            console.log('Bot: ' + info.first_name + ' (@' + info.username + ')');
        }).catch(err => {
            console.log('❌ Bot token invalid: ' + err.message);
            process.exit(1);
        });
    " 2>/dev/null || print_warning "Could not test bot token (requires environment setup)"
    
    echo
    
    # Check 2: Environment variables
    print_status "Check 2: Environment variables..."
    echo "BOT_TOKEN: $([ ! -z "$BOT_TOKEN" ] && echo "✅ Set" || echo "❌ Missing")"
    echo "ADMIN_USER_ID: $([ ! -z "$ADMIN_USER_ID" ] && echo "✅ Set" || echo "❌ Missing")"
    echo "NODE_ENV: ${NODE_ENV:-not set}"
    
    echo
    
    # Check 3: Railway deployment
    print_status "Check 3: Railway deployment status..."
    if command -v railway &> /dev/null && railway whoami &> /dev/null; then
        railway status --json 2>/dev/null | jq -r '.deployments[0].status // "Unknown"' || print_warning "Could not get deployment status"
    else
        print_warning "Railway CLI not available or not logged in"
    fi
    
    echo
    
    # Check 4: Process conflicts
    print_status "Check 4: Process conflicts..."
    if check_bot_processes; then
        print_warning "⚠️ Multiple bot instances detected - this can cause conflicts!"
    else
        print_status "✅ No process conflicts detected"
    fi
}

# Function to show help
show_help() {
    echo "🤖 Bot Instance Manager - Usage"
    echo "=============================="
    echo
    echo "Commands:"
    echo "  check          - Check for running bot processes"
    echo "  stop           - Stop all bot processes"
    echo "  restart        - Restart Railway deployment"
    echo "  status         - Check Railway deployment status"
    echo "  health         - Check bot responsiveness"
    echo "  logs           - Show bot logs"
    echo "  diagnose       - Run full diagnostics"
    echo "  clear          - Clear Railway deployments (manual)"
    echo "  help           - Show this help"
    echo
    echo "Examples:"
    echo "  ./bot-instance-manager.sh diagnose"
    echo "  ./bot-instance-manager.sh stop"
    echo "  ./bot-instance-manager.sh restart"
    echo
}

# Main script logic
case "${1:-help}" in
    "check")
        check_bot_processes
        ;;
    "stop")
        stop_all_bot_processes
        ;;
    "restart")
        stop_all_bot_processes
        restart_railway_deployment
        ;;
    "status")
        check_railway_deployment
        ;;
    "health")
        check_bot_responsiveness
        ;;
    "logs")
        show_bot_logs
        ;;
    "diagnose")
        diagnose_issues
        ;;
    "clear")
        clear_railway_deployments
        ;;
    "help"|*)
        show_help
        ;;
esac
