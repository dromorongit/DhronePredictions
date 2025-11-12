@echo off
REM Railway Deployment Script for Dhrone Predictions Bot (Windows Version)

setlocal enabledelayedexpansion

echo 🚀 Dhrone Predictions Bot - Railway Deployment Script
echo ==============================================

if not exist "bot-production.js" (
    echo ❌ bot-production.js not found!
    pause
    exit /b 1
)

echo ✅ Project directory verified

echo [STEP] Checking Railway CLI...
railway --version >nul 2>&1
if !errorlevel! neq 0 (
    echo [WARNING] Railway CLI not found
    echo [INFO] Installing Railway CLI...
    npm install -g @railway/cli
    if !errorlevel! neq 0 (
        echo ❌ Failed to install Railway CLI
        pause
        exit /b 1
    )
    echo ✅ Railway CLI installed
) else (
    echo ✅ Railway CLI installed
)

echo [STEP] Setting environment variables...

echo [INFO] Setting BOT_TOKEN...
railway variables set "BOT_TOKEN=8284449243:AAGIVO5aVfo1LAcQ29wXxHJoY3Pq4QqVOZ0"
if !errorlevel! equ 0 (echo ✅ BOT_TOKEN set) else (echo ❌ BOT_TOKEN failed)

echo [INFO] Setting ADMIN_USER_ID...
railway variables set "ADMIN_USER_ID=83222398921"
if !errorlevel! equ 0 (echo ✅ ADMIN_USER_ID set) else (echo ❌ ADMIN_USER_ID failed)

echo [INFO] Setting NODE_ENV...
railway variables set "NODE_ENV=production"
if !errorlevel! equ 0 (echo ✅ NODE_ENV set) else (echo ❌ NODE_ENV failed)

echo [INFO] Setting PORT...
railway variables set "PORT=3000"
if !errorlevel! equ 0 (echo ✅ PORT set) else (echo ❌ PORT failed)

echo [STEP] Deploying bot...
railway up

if !errorlevel! equ 0 (
    echo ✅ Deployment initiated!
) else (
    echo ❌ Deployment failed
    pause
    exit /b 1
)

echo [INFO] Waiting for deployment...
timeout /t 10 /nobreak >nul

echo [STEP] Checking status...
railway status

echo.
echo 🎉 Deployment Complete!
echo Check Railway Dashboard: https://railway.app/dashboard
echo Test bot: @dhronepredictionsbot with /start
pause