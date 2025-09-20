# Dhrone Predictions - Backend Setup Guide

This guide will help you set up the backend server for Dhrone Predictions website with user authentication and subscription management.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Existing Paystack payment links (already configured)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy the `.env` file and configure your settings:
```bash
cp .env .env.local
```

Edit `.env` with your actual values:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/dhronepredictions
# Or for MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/dhronepredictions

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 3. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# On Windows
net start MongoDB

# On macOS
brew services start mongodb/brew/mongodb-community

# On Linux
sudo systemctl start mongod
```

### 4. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatedetails` - Update user profile
- `PUT /api/auth/updatepassword` - Update password
- `GET /api/auth/logout` - Logout user

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Subscriptions
- `GET /api/subscriptions` - Get user's subscriptions
- `GET /api/subscriptions/current` - Get current subscription status
- `POST /api/subscriptions` - Create new subscription
- `GET /api/subscriptions/:id` - Get subscription by ID
- `PUT /api/subscriptions/:id/cancel` - Cancel subscription
- `PUT /api/subscriptions/:id/extend` - Extend subscription

### Payments
- `POST /api/payments/verify` - Create subscription after payment
- `GET /api/payments/history` - Get payment history

## 🔧 Configuration

### MongoDB Setup

#### Option 1: Local MongoDB
1. Install MongoDB Community Server
2. Start MongoDB service
3. Use default connection: `mongodb://localhost:27017/dhronepredictions`

#### Option 2: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get connection string and update `MONGODB_URI`

### Paystack Integration
**Note**: This backend works with your existing Paystack payment links. No additional Paystack setup required beyond what you already have configured for your current payment links.

### JWT Configuration
- `JWT_SECRET`: Use a strong, random string (at least 32 characters)
- `JWT_EXPIRE`: Token expiration time (default: 7 days)

## 🧪 Testing

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Test Authentication
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dhronepredictions
JWT_SECRET=your_production_jwt_secret
FRONTEND_URL=https://yourdomain.com
```

### Using PM2 (Process Manager)
```bash
npm install -g pm2
pm2 start server.js --name "dhrone-backend"
pm2 startup
pm2 save
```

### Using Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevents abuse with request limits
- **CORS**: Configured for frontend domain
- **Helmet**: Security headers
- **Input Validation**: Express-validator for all inputs
- **Database Security**: MongoDB with proper indexing and validation

## 📊 Database Models

### User Model
- Personal information (name, email)
- Authentication (password hash)
- Subscription data
- Activity tracking
- Preferences and statistics

### Subscription Model
- Plan details (daily, monthly, yearly)
- Payment information
- Status tracking
- Auto-renewal settings
- Extension history

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network access for MongoDB Atlas

2. **JWT Token Errors**
   - Check `JWT_SECRET` is set
   - Verify token hasn't expired
   - Ensure token is sent in Authorization header

3. **Payment Issues**
   - Ensure your existing Paystack payment links are working
   - Check that users are logged in before accessing VVIP
   - Verify MongoDB connection for subscription storage

4. **CORS Errors**
   - Update `FRONTEND_URL` in `.env`
   - Check if server is running on correct port

### Logs
Check server logs for detailed error information:
```bash
# With PM2
pm2 logs dhrone-backend

# Direct node
npm run dev
```

## 📞 Support

For issues or questions:
1. Check the logs for error details
2. Verify all environment variables are set
3. Ensure MongoDB and Paystack are properly configured
4. Test API endpoints individually

## 🔄 Migration from Frontend-Only

If migrating from the previous localStorage-based system:

1. **Backup User Data**: Export existing user data if needed
2. **Update Frontend**: Change API_BASE_URL to your backend URL (`http://localhost:5000/api`)
3. **Test Authentication**: Verify login/register work with backend
4. **Test Payments**: Ensure your existing Paystack links still work and create subscriptions
5. **Keep Payment Links**: Your existing Paystack payment links remain unchanged

### **Payment Flow After Migration:**
1. User logs in (required for VVIP access)
2. User clicks existing Paystack payment link
3. Paystack processes payment
4. User returns to site with success parameters
5. **Backend creates subscription** in database
6. Content unlocks with cross-device access

The backend maintains backward compatibility where possible while adding cross-device functionality.