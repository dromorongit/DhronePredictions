// Set updated date to current date
function setUpdatedDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = now.toLocaleDateString('en-US', options);
  const updatedElements = document.querySelectorAll('#updated-date');
  updatedElements.forEach(element => {
    element.textContent = `Updated: ${formattedDate}`;
  });
}

// Get yesterday's date for previously won tips
function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return yesterday.toLocaleDateString('en-US', options);
}

// Update all yesterday date elements
function updateYesterdayDates() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedYesterday = yesterday.toLocaleDateString('en-US', options);

  const yesterdayElements = document.querySelectorAll('#yesterday-date');
  yesterdayElements.forEach(element => {
    element.textContent = `Updated: ${formattedYesterday}`;
  });
}

// Update next day date for upcoming picks
function updateNextDayDate() {
  const nextDayDate = getNextDayDate();
  const nextDayElement = document.getElementById('next-day-date');
  if (nextDayElement) {
    nextDayElement.textContent = nextDayDate;
  }
}

// Get next day's date formatted nicely
function getNextDayDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  return tomorrow.toLocaleDateString('en-US', options);
}

// Update footer statistics
function updateFooterStats() {
  // Simulate dynamic statistics (in a real app, these would come from a backend)
  const baseClients = 35000;
  const basePredictions = 250000;
  const baseSatisfied = 32000;

  // Add some randomization to make it look dynamic
  const clientsVariation = Math.floor(Math.random() * 20) - 10; // -10 to +10
  const predictionsVariation = Math.floor(Math.random() * 50) - 25; // -25 to +25
  const satisfiedVariation = Math.floor(Math.random() * 15) - 7; // -7 to +7

  const totalClients = baseClients + clientsVariation;
  const totalPredictions = basePredictions + predictionsVariation;
  const satisfiedClients = baseSatisfied + satisfiedVariation;

  // Update the elements
  const clientsElement = document.getElementById('total-clients');
  const predictionsElement = document.getElementById('total-predictions');
  const satisfiedElement = document.getElementById('satisfied-clients');

  if (clientsElement) {
    clientsElement.textContent = totalClients.toLocaleString();
  }
  if (predictionsElement) {
    predictionsElement.textContent = totalPredictions.toLocaleString();
  }
  if (satisfiedElement) {
    satisfiedElement.textContent = satisfiedClients.toLocaleString();
  }
}

// Sort predictions by probability (highest to lowest)
function sortPredictions() {
  const grids = document.querySelectorAll('.predictions-grid');
  grids.forEach(grid => {
    const cards = Array.from(grid.children);
    cards.sort((a, b) => {
      const probA = parseInt(a.querySelector('.probability').textContent.replace('%', ''));
      const probB = parseInt(b.querySelector('.probability').textContent.replace('%', ''));
      return probB - probA; // Highest first
    });
    cards.forEach(card => grid.appendChild(card));
  });
}

// Toggle sort
let isSorted = false;
function toggleSort() {
  if (isSorted) {
    // To unsort, reload or reset, but for simplicity, just toggle
    location.reload(); // Simple way to reset
  } else {
    sortPredictions();
    isSorted = true;
  }
}

// Add sort button to each predictions section
function addSortButton() {
  const sections = document.querySelectorAll('.predictions-section');
  sections.forEach(section => {
    const button = document.createElement('button');
    button.textContent = 'Sort by Probability';
    button.className = 'sort-button';
    button.onclick = toggleSort;
    section.insertBefore(button, section.querySelector('.predictions-grid'));
  });
}

// VVIP Subscription functionality
function initVVIPSubscription() {
  const subscribeButtons = document.querySelectorAll('.subscribe-btn');
  const unlockBtn = document.querySelector('.unlock-btn');
  const predictionsSection = document.querySelector('.predictions-section');

  // Check if user has active subscription
  checkSubscriptionStatus();

  // Handle payment return from Paystack
  handlePaymentReturn();

  // Check for any pending payments that might need manual activation
  checkPendingPayments();

  // Handle subscription button clicks
  subscribeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const plan = e.target.dataset.plan;
      redirectToPaystack(plan);
    });
  });

  // Handle unlock button click
  if (unlockBtn) {
    unlockBtn.addEventListener('click', () => {
      // Scroll to subscription section
      document.querySelector('.subscription-section').scrollIntoView({
        behavior: 'smooth'
      });
    });
  }

  function redirectToPaystack(plan) {
    const paystackLinks = {
      daily: 'https://paystack.com/buy/dhrone-predictions-daily-vvip-fee',
      monthly: 'https://paystack.com/buy/dhrone-predictions-monthly-vvip-fee',
      yearly: 'https://paystack.com/buy/dhrone-predictions-yearly-vvip-fee'
    };

    // Store the plan in sessionStorage to handle return
    sessionStorage.setItem('pendingPlan', plan);

    // Redirect to Paystack payment page
    window.location.href = paystackLinks[plan];
  }

  function handlePaymentReturn() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment_status') || urlParams.get('status');
    const pendingPlan = sessionStorage.getItem('pendingPlan');

    // Check for various success indicators from Paystack
    const isSuccess = paymentStatus === 'success' ||
                      paymentStatus === 'successful' ||
                      urlParams.get('reference') !== null ||
                      urlParams.get('trxref') !== null;

    if (isSuccess && pendingPlan) {
      // Clear the pending plan
      sessionStorage.removeItem('pendingPlan');

      // Activate subscription
      activateSubscription(pendingPlan);

      // Unlock content
      unlockContent();

      // Generate access code and show Telegram prompt
      const accessCode = generateAccessCode();
      showTelegramAccessPrompt(pendingPlan, accessCode);

      // Clean up URL parameters
      const url = new URL(window.location);
      url.searchParams.delete('payment_status');
      url.searchParams.delete('status');
      url.searchParams.delete('reference');
      url.searchParams.delete('trxref');
      window.history.replaceState({}, '', url);
    }
  }

  function checkPendingPayments() {
    const pendingPlan = sessionStorage.getItem('pendingPlan');
    if (pendingPlan) {
      // Show a message to the user about pending payment
      setTimeout(() => {
        const message = document.createElement('div');
        message.className = 'pending-payment-message';
        message.innerHTML = `
          <div class="pending-content">
            <div class="pending-icon">⏳</div>
            <h3>Payment in Progress</h3>
            <p>You have a pending ${pendingPlan} subscription payment.</p>
            <p>If you've completed payment, please refresh this page.</p>
            <p>If payment failed, you can try again.</p>
            <button class="retry-payment-btn" data-plan="${pendingPlan}">Retry Payment</button>
            <button class="dismiss-pending">Dismiss</button>
          </div>
        `;

        document.body.appendChild(message);

        // Handle retry payment
        const retryBtn = message.querySelector('.retry-payment-btn');
        retryBtn.addEventListener('click', (e) => {
          const plan = e.target.dataset.plan;
          document.body.removeChild(message);
          redirectToPaystack(plan);
        });

        // Handle dismiss
        const dismissBtn = message.querySelector('.dismiss-pending');
        dismissBtn.addEventListener('click', () => {
          sessionStorage.removeItem('pendingPlan');
          document.body.removeChild(message);
        });

        // Auto-remove after 30 seconds
        setTimeout(() => {
          if (document.body.contains(message)) {
            document.body.removeChild(message);
          }
        }, 30000);
      }, 2000); // Show after 2 seconds
    }
  }

  function unlockContent() {
    const predictionsSection = document.querySelector('.predictions-section');
    if (predictionsSection) {
      predictionsSection.classList.remove('blurred');
      predictionsSection.classList.add('unlocked');
      showSubscriptionStatus();
    }
  }

  function checkSubscriptionStatus() {
    // Check legacy subscription first
    const legacySubscription = JSON.parse(localStorage.getItem('vvipSubscription'));
    let hasActiveSubscription = false;

    if (legacySubscription) {
      const now = new Date().getTime();
      if (now < legacySubscription.expiration) {
        hasActiveSubscription = true;
      } else {
        // Subscription expired, remove it
        localStorage.removeItem('vvipSubscription');
      }
    }

    // Also check user account subscription if logged in
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.currentSubscription) {
      const now = new Date().getTime();
      const subEndDate = new Date(currentUser.currentSubscription.endDate).getTime();
      if (now < subEndDate) {
        hasActiveSubscription = true;
      } else {
        // Mark subscription as expired in user account
        const accounts = getUserAccounts();
        if (accounts[currentUser.email] && accounts[currentUser.email].currentSubscription) {
          accounts[currentUser.email].currentSubscription.status = 'expired';
          saveUserAccounts(accounts);
          sessionStorage.setItem('currentUser', JSON.stringify(accounts[currentUser.email]));
        }
      }
    }

    if (hasActiveSubscription) {
      unlockContent();
    }
  }

  function activateSubscription(plan) {
    const now = new Date().getTime();
    let duration = 0;

    switch (plan) {
      case 'daily':
        duration = 24 * 60 * 60 * 1000; // 1 day
        break;
      case 'monthly':
        duration = 30 * 24 * 60 * 60 * 1000; // 30 days
        break;
      case 'yearly':
        duration = 365 * 24 * 60 * 60 * 1000; // 365 days
        break;
    }

    const expiration = now + duration;
    const subscription = {
      plan: plan,
      expiration: expiration,
      activated: now
    };

    // Store in legacy format for backward compatibility
    localStorage.setItem('vvipSubscription', JSON.stringify(subscription));

    // Also store in user account if user is logged in
    const currentUser = getCurrentUser();
    if (currentUser) {
      const userSubscription = {
        id: Date.now(),
        plan: plan,
        startDate: new Date(now).toISOString(),
        endDate: new Date(expiration).toISOString(),
        status: 'active',
        paymentRef: `payment_${Date.now()}`,
        paymentHistory: [{
          date: new Date(now).toISOString(),
          amount: getPlanPrice(plan),
          reference: `payment_${Date.now()}`,
          status: 'completed'
        }]
      };

      // Update user account
      const accounts = getUserAccounts();
      if (!accounts[currentUser.email].subscriptions) {
        accounts[currentUser.email].subscriptions = [];
      }
      accounts[currentUser.email].subscriptions.push(userSubscription);
      accounts[currentUser.email].currentSubscription = userSubscription;

      // Update stats
      if (!accounts[currentUser.email].stats) {
        accounts[currentUser.email].stats = {
          predictionsViewed: 0,
          totalSpent: 0,
          joinDate: accounts[currentUser.email].createdAt,
          daysActive: 1
        };
      }
      accounts[currentUser.email].stats.totalSpent += getPlanPrice(plan);

      saveUserAccounts(accounts);

      // Update session
      sessionStorage.setItem('currentUser', JSON.stringify(accounts[currentUser.email]));

      // Track activity
      trackActivity(currentUser.id, 'subscription_created', `Subscribed to ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`, {
        plan: plan,
        amount: getPlanPrice(plan)
      });
    }
  }

  function getPlanPrice(plan) {
    const prices = {
      'daily': 50,
      'monthly': 350,
      'yearly': 1750
    };
    return prices[plan] || 0;
  }

  function showSuccessMessage(plan, amount) {
    const durationText = getDurationText(plan);
    const message = document.createElement('div');
    message.className = 'success-message';
    message.innerHTML = `
      <div class="success-content">
        <div class="success-icon">✅</div>
        <h3>Payment Successful!</h3>
        <p>Thank you for your payment! You now have access to VVIP predictions</p>
        <p><strong>${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - ₵${amount}</strong></p>
        <p><em>Access valid for: ${durationText}</em></p>
        <button class="close-success">Continue to Predictions</button>
      </div>
    `;

    document.body.appendChild(message);

    const closeBtn = message.querySelector('.close-success');
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(message);
    });

    // Auto-remove after 8 seconds for real payments
    setTimeout(() => {
      if (document.body.contains(message)) {
        document.body.removeChild(message);
      }
    }, 8000);
  }

  function getDurationText(plan) {
    switch (plan) {
      case 'daily':
        return '24 hours';
      case 'monthly':
        return '30 days';
      case 'yearly':
        return '365 days';
      default:
        return 'Unknown duration';
    }
  }

  function showSubscriptionStatus() {
    const statusDiv = document.getElementById('subscription-status');
    const detailsDiv = document.getElementById('status-details');
    const expirationDiv = document.getElementById('expiration-info');

    if (statusDiv && detailsDiv && expirationDiv) {
      let subscription = null;

      // Check user account first, then legacy
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.currentSubscription) {
        subscription = currentUser.currentSubscription;
      } else {
        subscription = JSON.parse(localStorage.getItem('vvipSubscription'));
      }

      if (subscription) {
        const planName = subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1);
        detailsDiv.textContent = `${planName} Plan Active`;
        updateExpirationInfo();
        statusDiv.style.display = 'block';

        // Update expiration info every minute
        setInterval(updateExpirationInfo, 60000);
      }
    }
  }

  function updateExpirationInfo() {
    const expirationDiv = document.getElementById('expiration-info');
    if (expirationDiv) {
      let subscription = null;
      let expirationTime = null;

      // Check user account first, then legacy
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.currentSubscription) {
        subscription = currentUser.currentSubscription;
        expirationTime = new Date(subscription.endDate).getTime();
      } else {
        subscription = JSON.parse(localStorage.getItem('vvipSubscription'));
        if (subscription) {
          expirationTime = subscription.expiration;
        }
      }

      if (subscription && expirationTime) {
        const now = new Date().getTime();
        const timeLeft = expirationTime - now;

        if (timeLeft > 0) {
          const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

          let timeString = '';
          if (days > 0) {
            timeString += `${days} day${days > 1 ? 's' : ''} `;
          }
          if (hours > 0) {
            timeString += `${hours} hour${hours > 1 ? 's' : ''} `;
          }
          if (minutes > 0 && days === 0) {
            timeString += `${minutes} minute${minutes > 1 ? 's' : ''}`;
          }

          expirationDiv.textContent = `Expires in: ${timeString.trim()}`;
        } else {
          expirationDiv.textContent = 'Subscription expired';
        }
      }
    }
  }

  // Generate a unique 7-digit access code
  function generateAccessCode() {
    let code = '';
    for (let i = 0; i < 7; i++) {
      code += Math.floor(Math.random() * 10);
    }
    return code;
  }

  // Show Telegram access prompt with code and link
  function showTelegramAccessPrompt(plan, accessCode) {
    // Telegram group links for different plans
    const telegramLinks = {
      daily: 'https://t.me/+ZE_XiWcVZmU2YTA0',
      monthly: 'https://t.me/+9ihp-XFoRbRhZTJk',
      yearly: 'https://t.me/+6sf0IBhU2CZmM2U0'
    };

    const planNames = {
      daily: 'Daily VVIP',
      monthly: 'Monthly VVIP',
      yearly: 'Yearly VVIP'
    };

    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'telegram-access-modal';
    modal.innerHTML = `
      <div class="telegram-modal-content">
        <div class="telegram-modal-header">
          <div class="telegram-icon">🎉</div>
          <h2>Payment Successful!</h2>
          <p>Welcome to ${planNames[plan]}!</p>
        </div>

        <div class="telegram-access-info">
          <div class="access-code-section">
            <h3>Your Access Code:</h3>
            <div class="access-code">${accessCode}</div>
            <p class="code-note">⚠️ Save this code - you'll need it to join the group</p>
          </div>

          <div class="telegram-link-section">
            <h3>Join Your VIP Telegram Group:</h3>
            <p>Click the link below to join the ${planNames[plan]} Telegram group</p>
            <a href="${telegramLinks[plan]}" target="_blank" class="telegram-join-btn">
              🚀 Join ${planNames[plan]} Group
            </a>
            <p class="link-note">💡 Use your access code when prompted by the bot</p>
          </div>
        </div>

        <div class="telegram-instructions">
          <h4>📋 Instructions:</h4>
          <ol>
            <li>Click the "Join Group" button above</li>
            <li>The bot will ask for your access code</li>
            <li>Enter: <strong>${accessCode}</strong></li>
            <li>You'll be automatically added to the group!</li>
          </ol>
        </div>

        <div class="telegram-modal-actions">
          <button class="continue-to-vvip-btn">Continue to VVIP Content</button>
          <button class="copy-code-btn" data-code="${accessCode}">📋 Copy Code</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Handle continue button
    const continueBtn = modal.querySelector('.continue-to-vvip-btn');
    continueBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
      // Scroll to VVIP content
      const predictionsSection = document.querySelector('.predictions-section');
      if (predictionsSection) {
        predictionsSection.scrollIntoView({ behavior: 'smooth' });
      }
    });

    // Handle copy code button
    const copyBtn = modal.querySelector('.copy-code-btn');
    copyBtn.addEventListener('click', (e) => {
      const code = e.target.dataset.code;
      navigator.clipboard.writeText(code).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        copyBtn.style.background = '#28a745';
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.style.background = '';
        }, 2000);
      });
    });

    // Auto-remove after 5 minutes
    setTimeout(() => {
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    }, 300000); // 5 minutes
  }
}

// Contact Form Functionality
function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  if (!contactForm) return;

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get form data
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData);

    // Basic validation
    if (!validateContactForm(data)) {
      return;
    }

    // Simulate form submission
    handleContactFormSubmission(data);
  });
}

function validateContactForm(data) {
  const { name, email, subject, message } = data;

  // Clear previous messages
  clearMessages();

  // Name validation
  if (!name.trim()) {
    showMessage('Please enter your full name.', 'error');
    return false;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.trim() || !emailRegex.test(email)) {
    showMessage('Please enter a valid email address.', 'error');
    return false;
  }

  // Subject validation
  if (!subject) {
    showMessage('Please select a subject.', 'error');
    return false;
  }

  // Message validation
  if (!message.trim() || message.trim().length < 10) {
    showMessage('Please enter a message with at least 10 characters.', 'error');
    return false;
  }

  return true;
}

function handleContactFormSubmission(data) {
  // Show loading state
  const submitBtn = document.querySelector('.submit-btn');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Redirecting...';
  submitBtn.disabled = true;

  // Log form data for debugging
  console.log('Contact form data:', data);

  // Redirect to Telegram after a short delay
  setTimeout(() => {
    // Reset button state
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;

    // Redirect to Telegram
    window.location.href = 'https://t.me/padhoy';
  }, 1000);
}

function showMessage(text, type) {
  clearMessages();

  const message = document.createElement('div');
  message.className = `message ${type}`;
  message.textContent = text;

  const form = document.getElementById('contactForm');
  form.parentNode.insertBefore(message, form);

  // Auto-hide success messages
  if (type === 'success') {
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 5000);
  }
}

function clearMessages() {
  const messages = document.querySelectorAll('.message');
  messages.forEach(msg => {
    if (msg.parentNode) {
      msg.parentNode.removeChild(msg);
    }
  });
}

// Previously Won Tips functionality
function initWonTips() {
  // Update statistics on any page that has won tip cards
  if (document.querySelectorAll('.won-tip-card').length > 0) {
    updateWonTipsStats();
  }
}

function updateWonTipsStats() {
  const wonCards = document.querySelectorAll('.won-tip-card.won');
  const lostCards = document.querySelectorAll('.won-tip-card.lost');
  const totalCards = document.querySelectorAll('.won-tip-card');

  const wonCount = wonCards.length;
  const lostCount = lostCards.length;
  const totalCount = totalCards.length;
  const winRate = totalCount > 0 ? ((wonCount / totalCount) * 100).toFixed(1) : 0;

  // Update statistics display
  const winRateElement = document.querySelector('.tips-stats .stat-item:nth-child(1) .stat-number');
  const totalElement = document.querySelector('.tips-stats .stat-item:nth-child(2) .stat-number');
  const wonElement = document.querySelector('.tips-stats .stat-item:nth-child(3) .stat-number');
  const lostElement = document.querySelector('.tips-stats .stat-item:nth-child(4) .stat-number');

  if (winRateElement) winRateElement.textContent = winRate + '%';
  if (totalElement) totalElement.textContent = totalCount;
  if (wonElement) wonElement.textContent = wonCount;
  if (lostElement) lostElement.textContent = lostCount;
}

// User Account Management System (Frontend-only)
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

// Update navigation based on login status
function updateNavigation() {
  const currentUser = getCurrentUser();
  const navMenus = document.querySelectorAll('.nav-menu');

  navMenus.forEach(navMenu => {
    // Remove existing login/dashboard links
    const existingLoginLink = navMenu.querySelector('.login-link');
    const existingDashboardLink = navMenu.querySelector('.dashboard-link');
    const existingLogoutBtn = navMenu.querySelector('.logout-btn');

    if (existingLoginLink) existingLoginLink.remove();
    if (existingDashboardLink) existingDashboardLink.remove();
    if (existingLogoutBtn) existingLogoutBtn.remove();

    if (currentUser) {
      // User is logged in - show dashboard and logout
      const dashboardLink = document.createElement('li');
      dashboardLink.innerHTML = '<a href="dashboard.html" class="dashboard-link">Dashboard</a>';
      navMenu.appendChild(dashboardLink);

      const logoutBtn = document.createElement('li');
      logoutBtn.innerHTML = '<a href="#" class="logout-btn" onclick="logoutUser()">Logout</a>';
      navMenu.appendChild(logoutBtn);
    } else {
      // User not logged in - show login
      const loginLink = document.createElement('li');
      loginLink.innerHTML = '<a href="login.html" class="login-link">Login</a>';
      navMenu.appendChild(loginLink);
    }
  });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  setUpdatedDate();
  updateYesterdayDates();
  updateNextDayDate();
  updateFooterStats();
  updateNavigation();
  addSortButton();
  initVVIPSubscription();
  initContactForm();
  initWonTips();
});

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

// Betting Codes Functionality
function copyCode(codeId) {
  const codeElement = document.getElementById(codeId);
  if (!codeElement) return;

  const code = codeElement.textContent;

  // Copy to clipboard
  navigator.clipboard.writeText(code).then(() => {
    // Show success feedback
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '✅ Copied!';
    button.style.background = '#28a745';

    // Reset after 2 seconds
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy code:', err);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = code;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);

    // Show success feedback
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '✅ Copied!';
    button.style.background = '#28a745';

    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
    }, 2000);
  });
}

// Telegram link is handled in HTML with target="_blank"