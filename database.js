const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

// MongoDB connection string from Railway
const MONGODB_URI = process.env.MONGODB_URL || 'mongodb://mongo:wYzKHjSeLJOZJywivAbLzFXcjexLusLV@mongodb.railway.internal:27017';
const DB_NAME = 'dhrone_predictions_bot';

// Database connection instance
let db = null;
let client = null;

/**
 * Initialize MongoDB connection
 */
async function connectToDatabase() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Database: ${DB_NAME}`);
    
    // Create indexes for better performance
    await createIndexes();
    
    return db;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

/**
 * Create database indexes for better performance
 */
async function createIndexes() {
  try {
    // Indexes for users collection
    await db.collection('users').createIndex({ userId: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 });
    await db.collection('users').createIndex({ telegramId: 1 }, { unique: true });
    
    // Indexes for subscriptions collection
    await db.collection('subscriptions').createIndex({ userId: 1 });
    await db.collection('subscriptions').createIndex({ expiryDate: 1 });
    await db.collection('subscriptions').createIndex({ plan: 1 });
    
    // Indexes for access codes collection
    await db.collection('accessCodes').createIndex({ code: 1 }, { unique: true });
    await db.collection('accessCodes').createIndex({ plan: 1 });
    await db.collection('accessCodes').createIndex({ isUsed: 1 });
    
    // Indexes for user history collection
    await db.collection('userHistory').createIndex({ userId: 1 }, { unique: true });
    await db.collection('userHistory').createIndex({ lastCheck: -1 });
    
    // Indexes for website users collection
  await db.collection('websiteUsers').createIndex({ email: 1 }, { unique: true });
  await db.collection('websiteUsers').createIndex({ phoneNumber: 1 });
  await db.collection('websiteUsers').createIndex({ createdAt: -1 });
  await db.collection('websiteUsers').createIndex({ isActive: 1 });

  // Indexes for user payments collection
  await db.collection('userPayments').createIndex({ userId: 1 });
  await db.collection('userPayments').createIndex({ status: 1 });
  await db.collection('userPayments').createIndex({ createdAt: -1 });

  console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
  }
}

/**
 * Close MongoDB connection
 */
async function closeConnection() {
  try {
    if (client) {
      await client.close();
      console.log('🔌 MongoDB connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error.message);
  }
}

/**
 * Get database instance
 */
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDatabase() first.');
  }
  return db;
}

/**
 * User operations
 */
const userOperations = {
  /**
   * Create or update user
   */
  async createOrUpdateUser(userData) {
    const db = getDatabase();
    const { userId, username, firstName, lastName } = userData;
    
    const user = {
      userId,
      username: username || firstName || 'Unknown',
      firstName: firstName || '',
      lastName: lastName || '',
      telegramId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActive: new Date()
    };
    
    try {
      const result = await db.collection('users').findOneAndUpdate(
        { userId },
        { $set: user, $setOnInsert: { createdAt: new Date() } },
        { upsert: true, returnDocument: 'after' }
      );
      
      console.log(`✅ User ${username} (${userId}) saved to database`);
      return result.value;
    } catch (error) {
      console.error('❌ Error saving user:', error.message);
      throw error;
    }
  },
  
  /**
   * Get user by ID
   */
  async getUser(userId) {
    const db = getDatabase();
    try {
      return await db.collection('users').findOne({ userId });
    } catch (error) {
      console.error('❌ Error getting user:', error.message);
      throw error;
    }
  },
  
  /**
   * Update user last active time
   */
  async updateUserActivity(userId) {
    const db = getDatabase();
    try {
      await db.collection('users').updateOne(
        { userId },
        { $set: { lastActive: new Date(), updatedAt: new Date() } }
      );
    } catch (error) {
      console.error('❌ Error updating user activity:', error.message);
      throw error;
    }
  }
};

/**
 * Subscription operations
 */
const subscriptionOperations = {
  /**
   * Create subscription
   */
  async createSubscription(subscriptionData) {
    const db = getDatabase();
    const { userId, plan, code, expiryDate, username } = subscriptionData;
    
    const subscription = {
      userId,
      username: username || 'Unknown',
      plan,
      code,
      startDate: new Date(),
      expiryDate: new Date(expiryDate),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    try {
      const result = await db.collection('subscriptions').insertOne(subscription);
      console.log(`✅ Subscription created for user ${username} (${userId}) - ${plan} plan`);
      return { ...subscription, _id: result.insertedId };
    } catch (error) {
      console.error('❌ Error creating subscription:', error.message);
      throw error;
    }
  },
  
  /**
   * Get active subscription for user
   */
  async getActiveSubscription(userId) {
    const db = getDatabase();
    try {
      const now = new Date();
      return await db.collection('subscriptions').findOne({
        userId,
        expiryDate: { $gt: now },
        isActive: true
      });
    } catch (error) {
      console.error('❌ Error getting active subscription:', error.message);
      throw error;
    }
  },
  
  /**
   * Get all active subscriptions
   */
  async getAllActiveSubscriptions() {
    const db = getDatabase();
    try {
      const now = new Date();
      return await db.collection('subscriptions')
        .find({
          expiryDate: { $gt: now },
          isActive: true
        })
        .toArray();
    } catch (error) {
      console.error('❌ Error getting active subscriptions:', error.message);
      throw error;
    }
  },
  
  /**
   * Update subscription
   */
  async updateSubscription(userId, updates) {
    const db = getDatabase();
    try {
      await db.collection('subscriptions').updateOne(
        { userId },
        { $set: { ...updates, updatedAt: new Date() } }
      );
    } catch (error) {
      console.error('❌ Error updating subscription:', error.message);
      throw error;
    }
  },
  
  /**
   * Deactivate subscription
   */
  async deactivateSubscription(userId) {
    const db = getDatabase();
    try {
      await db.collection('subscriptions').updateOne(
        { userId },
        { $set: { isActive: false, updatedAt: new Date() } }
      );
      console.log(`🔄 Subscription deactivated for user ${userId}`);
    } catch (error) {
      console.error('❌ Error deactivating subscription:', error.message);
      throw error;
    }
  },
  
  /**
   * Get expired subscriptions
   */
  async getExpiredSubscriptions() {
    const db = getDatabase();
    try {
      const now = new Date();
      return await db.collection('subscriptions')
        .find({
          expiryDate: { $lte: now },
          isActive: true
        })
        .toArray();
    } catch (error) {
      console.error('❌ Error getting expired subscriptions:', error.message);
      throw error;
    }
  }
};

/**
 * Access code operations
 */
const codeOperations = {
  /**
   * Add access code
   */
  async addAccessCode(codeData) {
    const db = getDatabase();
    const { code, plan, isUsed = false, usedBy = null, usedAt = null } = codeData;
    
    const accessCode = {
      code,
      plan,
      isUsed,
      usedBy,
      usedAt: usedAt ? new Date(usedAt) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    try {
      const result = await db.collection('accessCodes').insertOne(accessCode);
      console.log(`✅ Access code ${code} added to database`);
      return { ...accessCode, _id: result.insertedId };
    } catch (error) {
      console.error('❌ Error adding access code:', error.message);
      throw error;
    }
  },
  
  /**
   * Get access code
   */
  async getAccessCode(code) {
    const db = getDatabase();
    try {
      return await db.collection('accessCodes').findOne({ code });
    } catch (error) {
      console.error('❌ Error getting access code:', error.message);
      throw error;
    }
  },
  
  /**
   * Mark code as used
   */
  async markCodeAsUsed(code, userId) {
    const db = getDatabase();
    try {
      await db.collection('accessCodes').updateOne(
        { code },
        { 
          $set: { 
            isUsed: true, 
            usedBy: userId, 
            usedAt: new Date(), 
            updatedAt: new Date() 
          } 
        }
      );
      console.log(`✅ Access code ${code} marked as used by user ${userId}`);
    } catch (error) {
      console.error('❌ Error marking code as used:', error.message);
      throw error;
    }
  },
  
  /**
   * Get all unused codes
   */
  async getUnusedCodes() {
    const db = getDatabase();
    try {
      return await db.collection('accessCodes').find({ isUsed: false }).toArray();
    } catch (error) {
      console.error('❌ Error getting unused codes:', error.message);
      throw error;
    }
  },
  
  /**
   * Get all used codes
   */
  async getUsedCodes() {
    const db = getDatabase();
    try {
      return await db.collection('accessCodes').find({ isUsed: true }).toArray();
    } catch (error) {
      console.error('❌ Error getting used codes:', error.message);
      throw error;
    }
  }
};

/**
 * User history operations
 */
const historyOperations = {
  /**
   * Update user history
   */
  async updateUserHistory(userId, historyData) {
    const db = getDatabase();
    const { lastStatus, lastCheck, lastCode, lastPlan } = historyData;
    
    try {
      await db.collection('userHistory').findOneAndUpdate(
        { userId },
        { 
          $set: { 
            lastStatus,
            lastCheck: new Date(lastCheck),
            lastCode,
            lastPlan,
            updatedAt: new Date()
          },
          $setOnInsert: { 
            userId,
            createdAt: new Date()
          }
        },
        { upsert: true, returnDocument: 'after' }
      );
    } catch (error) {
      console.error('❌ Error updating user history:', error.message);
      throw error;
    }
  },
  
  /**
   * Get user history
   */
  async getUserHistory(userId) {
    const db = getDatabase();
    try {
      return await db.collection('userHistory').findOne({ userId });
    } catch (error) {
      console.error('❌ Error getting user history:', error.message);
      throw error;
    }
  }
};

/**
 * Statistics operations
 */
const statisticsOperations = {
  /**
   * Get bot statistics
   */
  async getBotStatistics() {
    const db = getDatabase();
    try {
      const [
        totalUsers,
        activeSubscriptions,
        usedCodes,
        unusedCodes
      ] = await Promise.all([
        db.collection('users').countDocuments(),
        db.collection('subscriptions').countDocuments({ isActive: true }),
        db.collection('accessCodes').countDocuments({ isUsed: true }),
        db.collection('accessCodes').countDocuments({ isUsed: false })
      ]);
      
      return {
        totalUsers,
        activeSubscriptions,
        totalCodes: usedCodes + unusedCodes,
        usedCodes,
        unusedCodes
      };
    } catch (error) {
      console.error('❌ Error getting bot statistics:', error.message);
      throw error;
    }
  }
};

/**
 * Website User operations
 */
const websiteUserOperations = {
  /**
   * Create website user
   */
  async createWebsiteUser(userData) {
    const db = getDatabase();
    const { email, password, firstName, lastName, phoneNumber } = userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const websiteUser = {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : '',
      isEmailVerified: false,
      emailVerificationToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
      isActive: true,
      // Payment and subscription tracking
      payments: [],
      accessCodes: [],
      totalSpent: 0,
      activeSubscription: null
    };
    
    try {
      const result = await db.collection('websiteUsers').insertOne(websiteUser);
      console.log(`✅ Website user created: ${email}`);
      return { ...websiteUser, _id: result.insertedId };
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('User with this email already exists');
      }
      console.error('❌ Error creating website user:', error.message);
      throw error;
    }
  },
  
  /**
   * Get website user by email
   */
  async getWebsiteUserByEmail(email) {
    const db = getDatabase();
    try {
      return await db.collection('websiteUsers').findOne({ 
        email: email.toLowerCase().trim(),
        isActive: true 
      });
    } catch (error) {
      console.error('❌ Error getting website user by email:', error.message);
      throw error;
    }
  },
  
  /**
   * Get website user by ID
   */
  async getWebsiteUserById(userId) {
    const db = getDatabase();
    try {
      return await db.collection('websiteUsers').findOne({ 
        _id: new ObjectId(userId),
        isActive: true 
      });
    } catch (error) {
      console.error('❌ Error getting website user by ID:', error.message);
      throw error;
    }
  },
  
  /**
   * Authenticate website user
   */
  async authenticateWebsiteUser(email, password) {
    try {
      const user = await this.getWebsiteUserByEmail(email);
      if (!user) {
        return null;
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return null;
      }
      
      // Update last login
      await this.updateWebsiteUser(user._id, { lastLogin: new Date() });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('❌ Error authenticating website user:', error.message);
      throw error;
    }
  },
  
  /**
   * Update website user
   */
  async updateWebsiteUser(userId, updates) {
    const db = getDatabase();
    try {
      await db.collection('websiteUsers').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { ...updates, updatedAt: new Date() } }
      );
      console.log(`✅ Website user updated: ${userId}`);
    } catch (error) {
      console.error('❌ Error updating website user:', error.message);
      throw error;
    }
  },
  
  /**
   * Add payment to user
   */
  async addPaymentToUser(userId, paymentData) {
    const db = getDatabase();
    const { plan, amount, currency, status, transactionId, accessCode } = paymentData;
    
    const payment = {
      _id: new ObjectId(),
      plan,
      amount,
      currency,
      status,
      transactionId,
      accessCode,
      paymentDate: new Date(),
      createdAt: new Date()
    };
    
    try {
      await db.collection('websiteUsers').updateOne(
        { _id: new ObjectId(userId) },
        {
          $push: { payments: payment },
          $inc: { totalSpent: amount },
          $set: { updatedAt: new Date() }
        }
      );
      
      // Also add to access codes collection for bot
      if (accessCode) {
        await db.collection('accessCodes').insertOne({
          code: accessCode,
          plan,
          isUsed: false,
          generatedBy: userId,
          generatedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      console.log(`✅ Payment added to user ${userId}: ${plan} - ${amount} ${currency}`);
      return payment;
    } catch (error) {
      console.error('❌ Error adding payment to user:', error.message);
      throw error;
    }
  },
  
  /**
   * Get user payments
   */
  async getUserPayments(userId) {
    const db = getDatabase();
    try {
      const user = await db.collection('websiteUsers').findOne(
        { _id: new ObjectId(userId) },
        { projection: { payments: 1, _id: 0 } }
      );
      return user ? user.payments : [];
    } catch (error) {
      console.error('❌ Error getting user payments:', error.message);
      throw error;
    }
  },
  
  /**
   * Get user active subscription
   */
  async getUserActiveSubscription(userId) {
    const db = getDatabase();
    try {
      const user = await db.collection('websiteUsers').findOne(
        { _id: new ObjectId(userId) },
        { projection: { activeSubscription: 1, _id: 0 } }
      );
      return user ? user.activeSubscription : null;
    } catch (error) {
      console.error('❌ Error getting user active subscription:', error.message);
      throw error;
    }
  },
  
  /**
   * Update user active subscription
   */
  async updateUserActiveSubscription(userId, subscriptionData) {
    const db = getDatabase();
    try {
      await db.collection('websiteUsers').updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            activeSubscription: subscriptionData,
            updatedAt: new Date() 
          } 
        }
      );
      console.log(`✅ User ${userId} subscription updated: ${subscriptionData.plan}`);
    } catch (error) {
      console.error('❌ Error updating user subscription:', error.message);
      throw error;
    }
  },
  
  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(userId) {
    try {
      const subscription = await this.getUserActiveSubscription(userId);
      if (!subscription) return false;
      
      const now = new Date();
      return new Date(subscription.expiryDate) > now;
    } catch (error) {
      console.error('❌ Error checking user subscription:', error.message);
      return false;
    }
  },
  
  /**
   * Get user statistics
   */
  async getUserStatistics(userId) {
    const db = getDatabase();
    try {
      const user = await db.collection('websiteUsers').findOne(
        { _id: new ObjectId(userId) },
        { 
          projection: { 
            totalSpent: 1,
            payments: 1,
            activeSubscription: 1,
            createdAt: 1,
            lastLogin: 1,
            _id: 0 
          } 
        }
      );
      
      if (!user) return null;
      
      const now = new Date();
      const hasActiveSub = user.activeSubscription && new Date(user.activeSubscription.expiryDate) > now;
      const daysUntilExpiry = hasActiveSub ? 
        Math.ceil((new Date(user.activeSubscription.expiryDate) - now) / (1000 * 60 * 60 * 24)) : 0;
      
      return {
        totalSpent: user.totalSpent || 0,
        totalPayments: user.payments ? user.payments.length : 0,
        hasActiveSubscription: hasActiveSub,
        daysUntilExpiry,
        memberSince: user.createdAt,
        lastLogin: user.lastLogin
      };
    } catch (error) {
      console.error('❌ Error getting user statistics:', error.message);
      throw error;
    }
  },
  
  /**
   * Generate password reset token
   */
  async generatePasswordResetToken(email) {
    const db = getDatabase();
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expires = new Date(Date.now() + 3600000); // 1 hour
    
    try {
      await db.collection('websiteUsers').updateOne(
        { email: email.toLowerCase().trim() },
        {
          $set: {
            passwordResetToken: token,
            passwordResetExpires: expires,
            updatedAt: new Date()
          }
        }
      );
      
      return { token, expires };
    } catch (error) {
      console.error('❌ Error generating password reset token:', error.message);
      throw error;
    }
  },
  
  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    const db = getDatabase();
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    try {
      const result = await db.collection('websiteUsers').updateOne(
        {
          passwordResetToken: token,
          passwordResetExpires: { $gt: new Date() }
        },
        {
          $set: {
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpires: null,
            updatedAt: new Date()
          }
        }
      );
      
      if (result.matchedCount === 0) {
        throw new Error('Invalid or expired reset token');
      }
      
      console.log('✅ Password reset successful');
      return true;
    } catch (error) {
      console.error('❌ Error resetting password:', error.message);
      throw error;
    }
  }
};

// Export all operations
module.exports = {
  connectToDatabase,
  closeConnection,
  getDatabase,
  users: userOperations,
  subscriptions: subscriptionOperations,
  codes: codeOperations,
  history: historyOperations,
  statistics: statisticsOperations,
  websiteUsers: websiteUserOperations
};