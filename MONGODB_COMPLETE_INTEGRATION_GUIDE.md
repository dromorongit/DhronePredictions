# MongoDB Integration for Telegram Bot and Website User Management

## Overview
This integration provides a complete database solution for both Telegram bot users and website users with persistent data storage, secure authentication, and subscription management.

## System Architecture

### Components
1. **MongoDB Database** - Central data storage
2. **database.js** - MongoDB operations module
3. **user-api.js** - REST API server for website users
4. **bot-with-mongodb.js** - Telegram bot with MongoDB integration
5. **register.html** - User registration page with API integration
6. **login.html** - User login page with API integration  
7. **dashboard.html** - User dashboard with profile and subscription management

### Database Collections
- **users** - User account information
- **subscriptions** - User subscription details
- **access_codes** - Generated access codes
- **website_users** - Website-specific user data

## Environment Setup

### Required Environment Variables
```bash
MONGODB_URL=mongodb://mongo:wYzKHjSeLJOZJywivAbLzFXcjexLusLV@mongodb.railway.internal:27017
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Package Dependencies
```bash
npm install mongodb bcryptjs jsonwebtoken express cors dotenv
```

## API Endpoints

### Authentication Endpoints
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/forgot-password` - Password reset request
- `POST /api/reset-password` - Password reset with token
- `GET /api/profile` - Get user profile
- `PUT /api/update-profile` - Update user profile
- `PUT /api/change-password` - Change password

### Subscription Endpoints
- `GET /api/subscription` - Get subscription status
- `GET /api/access-codes` - Get user's access codes

### User Statistics
- `GET /api/user-stats` - Get user statistics

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  fullname: String,
  phone: String,
  telegramUsername: String,
  role: String (default: 'user'),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date,
  telegramUserId: Number,
  accessSource: String ('website' | 'telegram')
}
```

### Subscriptions Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (reference to users),
  planType: String ('VVIP', 'VIP', 'Premium'),
  startDate: Date,
  endDate: Date,
  isActive: Boolean,
  paymentAmount: Number,
  paymentMethod: String,
  daysRemaining: Number,
  autoRenew: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

### Access Codes Collection
```javascript
{
  _id: ObjectId,
  code: String (unique, required),
  userId: ObjectId (reference to users),
  codeType: String ('VVIP', 'VIP', 'Daily', 'Monthly'),
  timesUsed: Number (default: 0),
  maxUsage: Number,
  isActive: Boolean (default: true),
  expiresAt: Date,
  createdAt: Date,
  usedAt: Date
}
```

### Website Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  fullname: String,
  phone: String,
  telegramUsername: String,
  isEmailVerified: Boolean (default: false),
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  loginAttempts: Number (default: 0),
  lockUntil: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Deployment Instructions

### 1. Deploy the API Server
```bash
# Start the user API server
node user-api.js

# Or deploy to Railway
railway up user-api.js
```

### 2. Update HTML File URLs
In all HTML files, update the API base URL:
```javascript
this.apiBase = 'https://dhronepredictions-production.up.railway.app/api'; // Production API URL
```

### 3. Deploy the Telegram Bot
```bash
# Start the Telegram bot
node bot-with-mongodb.js

# Or deploy to Railway
railway up bot-with-mongodb.js
```

## Website Integration

### Registration Process
1. User fills registration form
2. Frontend sends data to `/api/register`
3. Backend validates and creates user account
4. User receives welcome message and can login

### Login Process
1. User enters email and password
2. Frontend sends data to `/api/login`
3. Backend validates credentials and returns JWT token
4. Frontend stores token and redirects to dashboard
5. Dashboard loads user data and subscription information

### Dashboard Features
- **Overview Tab**: User statistics and performance metrics
- **Profile Tab**: Update personal information and change password
- **Subscription Tab**: View current subscription and renewal options
- **Access Codes Tab**: View purchased access codes and usage

## Telegram Bot Integration

### User Registration
```javascript
// Bot handles user registration
const userData = {
  telegramUserId: msg.from.id,
  telegramUsername: msg.from.username,
  fullname: `${msg.from.first_name} ${msg.from.last_name || ''}`.trim(),
  accessSource: 'telegram'
};

// Save to MongoDB
await saveUserToDatabase(userData);
```

### Access Code Validation
```javascript
// Validate access code against database
const accessCode = await validateAccessCode(code, telegramUserId);
if (accessCode && accessCode.isActive) {
  // Grant access and update usage
  await updateAccessCodeUsage(accessCode._id);
}
```

## Security Features

### Password Security
- Bcrypt hashing with salt rounds
- Password strength validation
- Secure password reset with tokens

### Authentication
- JWT tokens with expiration
- Token-based API authentication
- Session management

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- Rate limiting for API endpoints

## Monitoring and Maintenance

### Database Indexes
Ensure proper indexes for performance:
```javascript
// Users collection indexes
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "telegramUserId": 1 }, { unique: true, sparse: true })

// Subscriptions collection indexes
db.subscriptions.createIndex({ "userId": 1 })
db.subscriptions.createIndex({ "isActive": 1 })

// Access codes collection indexes
db.access_codes.createIndex({ "code": 1 }, { unique: true })
db.access_codes.createIndex({ "userId": 1 })

// Website users collection indexes
db.website_users.createIndex({ "email": 1 }, { unique: true })
```

### Health Checks
- Monitor database connection status
- Check API endpoint availability
- Track user registration and login rates

## Migration from JSON Files

If migrating from JSON file storage:

1. **Backup existing data**
2. **Run migration script** to transfer data to MongoDB
3. **Update all file paths** in bot code
4. **Test integration** thoroughly
5. **Deploy updated version**

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MongoDB URL and credentials
   - Ensure Railway MongoDB service is active
   - Verify network connectivity

2. **JWT Token Issues**
   - Check JWT_SECRET environment variable
   - Verify token expiration settings
   - Ensure proper token storage

3. **API Authentication Errors**
   - Check Authorization header format
   - Verify token validity
   - Ensure CORS settings

### Logging
Enable detailed logging for debugging:
```javascript
// Enable MongoDB logging
mongoose.set('debug', true);

// Add API request logging
app.use(morgan('combined'));
```

## Performance Optimization

1. **Database Indexing**
   - Create indexes on frequently queried fields
   - Use compound indexes for complex queries

2. **Connection Pooling**
   - Configure MongoDB connection pool
   - Reuse connections efficiently

3. **Caching**
   - Cache frequently accessed data
   - Use Redis for session storage

## Backup and Recovery

1. **Automated Backups**
   - Configure Railway automatic backups
   - Schedule regular data exports

2. **Data Recovery**
   - Test restoration procedures
   - Maintain backup verification

## Support and Maintenance

### Regular Tasks
- Monitor database performance
- Update dependencies regularly
- Review and rotate JWT secrets
- Analyze user usage patterns

### Security Updates
- Keep MongoDB driver updated
- Monitor for security vulnerabilities
- Implement rate limiting
- Regular security audits

This comprehensive integration provides a robust foundation for managing users across both Telegram bot and website platforms with secure, scalable, and maintainable architecture.