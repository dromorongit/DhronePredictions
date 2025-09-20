// User Account Management System
// Frontend-only implementation using localStorage

// Simple password hashing (for demo purposes)
function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

// Get user accounts from localStorage
function getUserAccounts() {
  const accounts = localStorage.getItem('userAccounts');
  return accounts ? JSON.parse(accounts) : {};
}

// Save user accounts to localStorage
function saveUserAccounts(accounts) {
  localStorage.setItem('userAccounts', JSON.stringify(accounts));
}

// Register new user
function registerUser(name, email, password) {
  const accounts = getUserAccounts();

  // Check if user already exists
  if (accounts[email]) {
    throw new Error('An account with this email already exists');
  }

  // Create new user
  const userId = Date.now().toString();
  const user = {
    id: userId,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashPassword(password),
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    subscriptions: [],
    activity: [{
      id: Date.now(),
      type: 'account_created',
      description: 'Account created successfully',
      timestamp: new Date().toISOString()
    }],
    preferences: {
      notifications: true,
      theme: 'dark',
      language: 'en'
    },
    stats: {
      predictionsViewed: 0,
      totalSpent: 0,
      joinDate: new Date().toISOString(),
      daysActive: 1
    }
  };

  accounts[email] = user;
  saveUserAccounts(accounts);

  // Set current user session
  sessionStorage.setItem('currentUser', JSON.stringify(user));

  return user;
}

// Login user
function loginUser(email, password) {
  const accounts = getUserAccounts();
  const user = accounts[email.toLowerCase().trim()];

  if (!user) {
    throw new Error('Account not found');
  }

  if (user.password !== hashPassword(password)) {
    throw new Error('Invalid password');
  }

  // Update last login
  user.lastLogin = new Date().toISOString();
  saveUserAccounts(accounts);

  // Set current user session
  sessionStorage.setItem('currentUser', JSON.stringify(user));

  return user;
}

// Get current user
function getCurrentUser() {
  const userData = sessionStorage.getItem('currentUser');
  return userData ? JSON.parse(userData) : null;
}

// Logout user
function logoutUser() {
  sessionStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

// Check if user is logged in
function isLoggedIn() {
  return getCurrentUser() !== null;
}

// Update user data
function updateUser(userId, updates) {
  const accounts = getUserAccounts();
  const user = Object.values(accounts).find(u => u.id === userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Update user data
  Object.assign(user, updates);
  saveUserAccounts(accounts);

  // Update session if current user
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
  }

  return user;
}

// Track user activity
function trackActivity(userId, activityType, description, details = {}) {
  const accounts = getUserAccounts();
  const user = Object.values(accounts).find(u => u.id === userId);

  if (!user) return;

  const activity = {
    id: Date.now(),
    type: activityType,
    description: description,
    details: details,
    timestamp: new Date().toISOString()
  };

  if (!user.activity) user.activity = [];
  user.activity.unshift(activity); // Add to beginning

  // Keep only last 50 activities
  if (user.activity.length > 50) {
    user.activity = user.activity.slice(0, 50);
  }

  saveUserAccounts(accounts);

  // Update session if current user
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
  }
}

// Get user activity
function getUserActivity(userId, limit = 10) {
  const accounts = getUserAccounts();
  const user = Object.values(accounts).find(u => u.id === userId);

  if (!user || !user.activity) return [];

  return user.activity.slice(0, limit);
}

// Initialize login page
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already logged in
  if (isLoggedIn()) {
    window.location.href = 'dashboard.html';
    return;
  }

  // Tab switching
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.auth-tab-content');
  const switchLinks = document.querySelectorAll('.switch-tab');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;

      // Update tab buttons
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Update tab content
      tabContents.forEach(content => content.classList.remove('active'));
      document.getElementById(tabName + 'Tab').classList.add('active');
    });
  });

  switchLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = link.dataset.tab;

      // Trigger tab switch
      const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
      if (targetButton) {
        targetButton.click();
      }
    });
  });

  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Signing in...';
      submitBtn.disabled = true;

      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      try {
        const user = await loginUser(email, password);

        // Show success message
        showMessage('Login successful! Redirecting...', 'success');

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);

      } catch (error) {
        showMessage(error.message, 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // Register form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Creating account...';
      submitBtn.disabled = true;

      const name = document.getElementById('regName').value;
      const email = document.getElementById('regEmail').value;
      const password = document.getElementById('regPassword').value;
      const confirmPassword = document.getElementById('regConfirmPassword').value;

      // Validation
      if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

      if (password.length < 6) {
        showMessage('Password must be at least 6 characters', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

      try {
        const user = await registerUser(name, email, password);

        // Show success message
        showMessage('Account created successfully! Redirecting...', 'success');

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);

      } catch (error) {
        showMessage(error.message, 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }
});

// Utility function to show messages
function showMessage(text, type) {
  // Remove existing messages
  const existingMessages = document.querySelectorAll('.auth-message');
  existingMessages.forEach(msg => msg.removeChild(msg));

  const message = document.createElement('div');
  message.className = `auth-message ${type}`;
  message.textContent = text;

  const form = document.querySelector('.auth-form');
  if (form) {
    form.parentNode.insertBefore(message, form);

    // Auto-hide success messages
    if (type === 'success') {
      setTimeout(() => {
        if (message.parentNode) {
          message.parentNode.removeChild(message);
        }
      }, 3000);
    }
  }
}

// Export functions for use in other files
window.UserAccount = {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  isLoggedIn,
  updateUser,
  trackActivity,
  getUserActivity
};