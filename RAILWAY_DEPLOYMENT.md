# Railway Deployment Guide

This guide explains how to deploy your automated prediction management system to Railway.

## 🚀 Quick Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add automated prediction system with server"
   git push origin main
   ```

2. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub"
   - Select your repository
   - Railway will automatically detect Node.js and deploy

3. **Your server will be live at**: `https://your-app.railway.app`

## 🔧 What Happens Automatically

- Railway detects `package.json` and installs dependencies
- Runs `npm start` which executes `node server.js`
- Server runs on Railway's assigned port (handled automatically)
- All endpoints become available immediately

## 📋 Available Endpoints

- `GET /` - Serves static files (your website)
- `GET /health` - Health check endpoint
- `POST /update-html` - Updates HTML files with new predictions
- `PUT /update-data` - Updates prediction data
- `GET /admin.html` - Admin interface for entering results

## 🧪 Testing Your Deployment

1. Open your Railway URL in browser: `https://your-app.railway.app`
2. Navigate to `/admin.html` to access the admin panel
3. Enter match results and click "Update All Pages"
4. Updates happen instantly via the server

## ⚠️ Troubleshooting

**If server doesn't start:**
- Check Railway logs in the dashboard
- Ensure `package.json` has correct start script
- Verify Node.js version compatibility

**If updates fail:**
- Check browser console for errors
- Verify CORS settings in server.js
- Ensure JSON file is writable

**If admin panel doesn't load:**
- Check if all files were pushed to GitHub
- Verify file paths in HTML are correct

## 🎯 Production Ready Features

✅ **Automatic server startup**
✅ **Environment variable support**
✅ **CORS enabled for admin panel**
✅ **Error handling and logging**
✅ **Health check endpoint**
✅ **Static file serving**

Your system is fully configured for Railway deployment! 🚀