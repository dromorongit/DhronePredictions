const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// JWT Token generation
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// JWT Token verification middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Initialize database connection
let databaseConnected = false;

async function initializeAPI() {
  try {
    await db.connectToDatabase();
    databaseConnected = true;
    console.log('✅ User API database connection established');
  } catch (error) {
    console.error('❌ Failed to initialize user API database:', error.message);
    console.error('🔧 API will continue running but user operations will not work');
    databaseConnected = false;
  }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: databaseConnected ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    if (!databaseConnected) {
      return res.status(503).json({ error: 'Database service unavailable' });
    }

    const { email, password, firstName, lastName, phoneNumber } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['email', 'password', 'firstName', 'lastName']
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Create user
    const newUser = await db.websiteUsers.createWebsiteUser({
      email,
      password,
      firstName,
      lastName,
      phoneNumber
    });

    // Generate token
    const token = generateToken(newUser._id);

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Registration error:', error.message);
    if (error.message.includes('already exists')) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    if (!databaseConnected) {
      return res.status(503).json({ error: 'Database service unavailable' });
    }

    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Authenticate user
    const user = await db.websiteUsers.authenticateWebsiteUser(email, password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Get user statistics
    const stats = await db.websiteUsers.getUserStatistics(user._id);

    res.json({
      message: 'Login successful',
      user,
      statistics: stats,
      token
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get User Profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    if (!databaseConnected) {
      return res.status(503).json({ error: 'Database service unavailable' });
    }

    const user = await db.websiteUsers.getWebsiteUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user statistics
    const stats = await db.websiteUsers.getUserStatistics(req.user.userId);
    const payments = await db.websiteUsers.getUserPayments(req.user.userId);

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      statistics: stats,
      payments
    });

  } catch (error) {
    console.error('Profile error:', error.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update User Profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    if (!databaseConnected) {
      return res.status(503).json({ error: 'Database service unavailable' });
    }

    const { firstName, lastName, phoneNumber } = req.body;
    const updates = {};

    if (firstName) updates.firstName = firstName.trim();
    if (lastName) updates.lastName = lastName.trim();
    if (phoneNumber) updates.phoneNumber = phoneNumber.trim();

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    await db.websiteUsers.updateWebsiteUser(req.user.userId, updates);

    // Return updated user
    const user = await db.websiteUsers.getWebsiteUserById(req.user.userId);
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change Password
app.put('/api/change-password', authenticateToken, async (req, res) => {
  try {
    if (!databaseConnected) {
      return res.status(503).json({ error: 'Database service unavailable' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Get current user with password
    const user = await db.websiteUsers.getWebsiteUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const bcrypt = require('bcrypt');
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await db.websiteUsers.updateWebsiteUser(req.user.userId, { 
      password: hashedNewPassword 
    });

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Password change error:', error.message);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Process Payment and Generate Access Code
app.post('/api/process-payment', authenticateToken, async (req, res) => {
  try {
    if (!databaseConnected) {
      return res.status(503).json({ error: 'Database service unavailable' });
    }

    const { plan, amount, currency, transactionId } = req.body;

    // Validation
    if (!plan || !amount || !currency || !transactionId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['plan', 'amount', 'currency', 'transactionId']
      });
    }

    // Validate plan
    const validPlans = ['daily', 'monthly', 'yearly'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    // Generate access code
    const accessCode = generateAccessCode(plan);

    // Add payment to user
    const payment = await db.websiteUsers.addPaymentToUser(req.user.userId, {
      plan,
      amount,
      currency,
      status: 'completed',
      transactionId,
      accessCode
    });

    // Calculate subscription expiry
    const planDurations = {
      daily: 24 * 60 * 60 * 1000, // 24 hours
      monthly: 30 * 24 * 60 * 60 * 1000, // 30 days
      yearly: 365 * 24 * 60 * 60 * 1000 // 365 days
    };

    const subscriptionData = {
      plan,
      accessCode,
      startDate: new Date(),
      expiryDate: new Date(Date.now() + planDurations[plan]),
      isActive: true,
      source: 'website'
    };

    // Update user's active subscription
    await db.websiteUsers.updateUserActiveSubscription(req.user.userId, subscriptionData);

    res.json({
      message: 'Payment processed successfully',
      payment,
      accessCode,
      subscription: subscriptionData
    });

  } catch (error) {
    console.error('Payment processing error:', error.message);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Get User Subscription Status
app.get('/api/subscription-status', authenticateToken, async (req, res) => {
  try {
    if (!databaseConnected) {
      return res.status(503).json({ error: 'Database service unavailable' });
    }

    const hasActiveSubscription = await db.websiteUsers.hasActiveSubscription(req.user.userId);
    const subscription = await db.websiteUsers.getUserActiveSubscription(req.user.userId);

    res.json({
      hasActiveSubscription,
      subscription
    });

  } catch (error) {
    console.error('Subscription status error:', error.message);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

// Get User Payments History
app.get('/api/payments', authenticateToken, async (req, res) => {
  try {
    if (!databaseConnected) {
      return res.status(503).json({ error: 'Database service unavailable' });
    }

    const payments = await db.websiteUsers.getUserPayments(req.user.userId);

    res.json({
      payments
    });

  } catch (error) {
    console.error('Payments fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Password Reset Request
app.post('/api/forgot-password', async (req, res) => {
  try {
    if (!databaseConnected) {
      return res.status(503).json({ error: 'Database service unavailable' });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const user = await db.websiteUsers.getWebsiteUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate reset token
    const { token, expires } = await db.websiteUsers.generatePasswordResetToken(email);

    // TODO: Send email with reset link
    console.log(`Password reset token for ${email}: ${token}`);
    console.log(`Reset link would be: ${process.env.WEBSITE_URL}/reset-password?token=${token}`);

    res.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.',
      // In development, return the token for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken: token })
    });

  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ error: 'Password reset request failed' });
  }
});

// Password Reset
app.post('/api/reset-password', async (req, res) => {
  try {
    if (!databaseConnected) {
      return res.status(503).json({ error: 'Database service unavailable' });
    }

    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    await db.websiteUsers.resetPassword(token, newPassword);

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error.message);
    if (error.message.includes('Invalid or expired')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Password reset failed' });
    }
  }
});

// Helper function to generate access codes
function generateAccessCode(plan) {
  // Generate a 7-digit code
  const code = Math.floor(1000000 + Math.random() * 9000000).toString();
  
  // Add plan-specific prefix for tracking
  const planPrefix = {
    daily: '1',
    monthly: '4',
    yearly: '7'
  };
  
  return planPrefix[plan] + code.substring(1);
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Start server
async function startServer() {
  await initializeAPI();
  
  app.listen(PORT, () => {
    console.log(`🌐 User API server running on port ${PORT}`);
    console.log(`🔗 API Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🗄️ Database: ${databaseConnected ? 'Connected' : 'Disconnected'}`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\\n🔄 Shutting down User API server...');
  await db.closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\\n🔄 Shutting down User API server...');
  await db.closeConnection();
  process.exit(0);
});

// Start the server
startServer().catch(error => {
  console.error('❌ Failed to start User API server:', error);
  process.exit(1);
});

module.exports = app;