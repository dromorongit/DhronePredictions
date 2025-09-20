// Dashboard functionality
// Frontend-only implementation

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  if (!window.UserAccount || !window.UserAccount.isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }

  // Load user data
  loadDashboardData();

  // Setup event listeners
  setupDashboardListeners();

  // Setup profile image functionality
  setupProfileImageUpload();
});

// Load dashboard data
function loadDashboardData() {
  const user = window.UserAccount.getCurrentUser();
  if (!user) return;

  // Update user info
  document.getElementById('userName').textContent = `Welcome back, ${user.name}!`;
  document.getElementById('userEmail').textContent = user.email;

  // Update user initials
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
  document.getElementById('userInitials').textContent = initials;

  // Update join date
  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });
  document.getElementById('joinDate').textContent = joinDate;

  // Load subscription data
  loadSubscriptionData(user);

  // Load user statistics
  loadUserStats(user);

  // Load recent activity
  loadRecentActivity(user);

  // Load profile image
  loadProfileImage(user);
}

// Load subscription data
function loadSubscriptionData(user) {
  const subscription = user.currentSubscription || getActiveSubscription(user);

  if (subscription) {
    document.getElementById('currentPlan').textContent = formatPlanName(subscription.plan);

    const now = new Date().getTime();
    const timeLeft = subscription.endDate ? new Date(subscription.endDate).getTime() - now : 0;

    if (timeLeft > 0) {
      const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
      document.getElementById('timeLeft').textContent = `${daysLeft} days remaining`;

      // Calculate progress
      const totalDuration = getPlanDuration(subscription.plan);
      const usedDuration = totalDuration - (timeLeft / (1000 * 60 * 60 * 24));
      const progressPercent = Math.max(0, Math.min(100, (usedDuration / totalDuration) * 100));
      document.getElementById('progressFill').style.width = `${progressPercent}%`;
    } else {
      document.getElementById('timeLeft').textContent = 'Subscription expired';
      document.getElementById('progressFill').style.width = '100%';
    }
  } else {
    document.getElementById('currentPlan').textContent = 'No Active Plan';
    document.getElementById('timeLeft').textContent = 'No active subscription';
    document.getElementById('progressFill').style.width = '0%';
  }
}

// Get active subscription
function getActiveSubscription(user) {
  if (!user.subscriptions || user.subscriptions.length === 0) return null;

  const now = new Date().getTime();
  return user.subscriptions.find(sub => {
    const endDate = new Date(sub.endDate).getTime();
    return endDate > now;
  });
}

// Load user statistics
function loadUserStats(user) {
  const stats = user.stats || {
    predictionsViewed: 0,
    totalSpent: 0,
    daysActive: 1
  };

  document.getElementById('predictionsViewed').textContent = stats.predictionsViewed || 0;

  // Calculate success rate (mock data for now)
  const successRate = Math.floor(Math.random() * 20) + 70; // 70-90%
  document.getElementById('successRate').textContent = `${successRate}%`;

  // Calculate days active
  const joinDate = new Date(user.createdAt);
  const now = new Date();
  const daysActive = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24)) + 1;
  document.getElementById('daysActive').textContent = daysActive;

  // Calculate total spent
  let totalSpent = 0;
  if (user.subscriptions) {
    user.subscriptions.forEach(sub => {
      totalSpent += getPlanPrice(sub.plan);
    });
  }
  document.getElementById('totalSpent').textContent = `₵${totalSpent}`;
}

// Load recent activity
function loadRecentActivity(user) {
  const activities = window.UserAccount.getUserActivity(user.id, 5);
  const activityList = document.getElementById('activityList');

  if (activities.length === 0) {
    activityList.innerHTML = `
      <div class="activity-item">
        <div class="activity-icon">👋</div>
        <div class="activity-content">
          <p>Welcome to Dhrone Predictions! Your account has been created.</p>
          <span class="activity-time">Just now</span>
        </div>
      </div>
    `;
    return;
  }

  activityList.innerHTML = activities.map(activity => `
    <div class="activity-item">
      <div class="activity-icon">${getActivityIcon(activity.type)}</div>
      <div class="activity-content">
        <p>${activity.description}</p>
        <span class="activity-time">${formatActivityTime(activity.timestamp)}</span>
      </div>
    </div>
  `).join('');
}

// Get activity icon
function getActivityIcon(type) {
  const icons = {
    'login': '🔐',
    'logout': '👋',
    'subscription_created': '💳',
    'prediction_viewed': '📊',
    'account_created': '🎉',
    'profile_updated': '👤'
  };
  return icons[type] || '📝';
}

// Format activity time
function formatActivityTime(timestamp) {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffMs = now - activityTime;
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffHours < 1) {
    return 'Just now';
  } else if (diffHours < 24) {
    return `${Math.floor(diffHours)} hours ago`;
  } else if (diffDays < 7) {
    return `${Math.floor(diffDays)} days ago`;
  } else {
    return activityTime.toLocaleDateString();
  }
}

// Setup dashboard event listeners
function setupDashboardListeners() {
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) {
        window.UserAccount.logoutUser();
      }
    });
  }

  // Upgrade subscription
  document.addEventListener('click', (e) => {
    if (e.target.id === 'upgradeSubscription' || e.target.closest('#upgradeSubscription')) {
      window.location.href = 'vvip.html';
    }
  });

  // View payment history
  document.addEventListener('click', (e) => {
    if (e.target.id === 'viewPaymentHistory' || e.target.closest('#viewPaymentHistory')) {
      showPaymentHistory();
    }
  });
}

// Show payment history
function showPaymentHistory() {
  const user = window.UserAccount.getCurrentUser();
  if (!user || !user.subscriptions) return;

  let historyHTML = '<h3>Payment History</h3>';

  if (user.subscriptions.length === 0) {
    historyHTML += '<p>No payment history available.</p>';
  } else {
    historyHTML += '<div class="payment-list">';
    user.subscriptions.forEach(sub => {
      const date = new Date(sub.startDate).toLocaleDateString();
      const amount = getPlanPrice(sub.plan);
      historyHTML += `
        <div class="payment-item">
          <div class="payment-info">
            <span class="plan-name">${formatPlanName(sub.plan)}</span>
            <span class="payment-date">${date}</span>
          </div>
          <span class="payment-amount">₵${amount}</span>
        </div>
      `;
    });
    historyHTML += '</div>';
  }

  // Create modal
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Payment History</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        ${historyHTML}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close modal
  modal.querySelector('.modal-close').addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// Utility functions
function formatPlanName(plan) {
  return plan.charAt(0).toUpperCase() + plan.slice(1) + ' Plan';
}

function getPlanDuration(plan) {
  const durations = {
    'daily': 1,
    'monthly': 30,
    'yearly': 365
  };
  return durations[plan] || 30;
}

function getPlanPrice(plan) {
  const prices = {
    'daily': 50,
    'monthly': 350,
    'yearly': 1750
  };
  return prices[plan] || 0;
}

// Global functions for HTML onclick
window.upgradeSubscription = () => {
  window.location.href = 'vvip.html';
};

window.viewPaymentHistory = () => {
  showPaymentHistory();
};

window.editProfile = () => {
  alert('Profile editing coming soon!');
};

window.manageNotifications = () => {
  alert('Notification management coming soon!');
};

window.changePassword = () => {
  alert('Password change coming soon!');
};

window.exportData = () => {
  const user = window.UserAccount.getCurrentUser();
  if (user) {
    const dataStr = JSON.stringify(user, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-data.json';
    link.click();

    URL.revokeObjectURL(url);
  }
};

// Profile Image Upload Functionality
function setupProfileImageUpload() {
  const imageInput = document.getElementById('profileImageInput');
  const profileImage = document.getElementById('userProfileImage');
  const userInitials = document.getElementById('userInitials');

  if (!imageInput || !profileImage || !userInitials) return;

  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  });
}

function handleImageUpload(file) {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Please select a valid image file.');
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('Image size must be less than 5MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const imageData = e.target.result;

    // Display the image
    displayProfileImage(imageData);

    // Save to user data
    saveProfileImage(imageData);
  };

  reader.readAsDataURL(file);
}

function displayProfileImage(imageData) {
  const profileImage = document.getElementById('userProfileImage');
  const userInitials = document.getElementById('userInitials');

  if (profileImage && userInitials) {
    profileImage.src = imageData;
    profileImage.style.display = 'block';
    userInitials.style.display = 'none';
  }
}

function saveProfileImage(imageData) {
  const user = window.UserAccount.getCurrentUser();
  if (user) {
    // Update user data with profile image
    user.profileImage = imageData;

    // Save to localStorage via UserAccount system
    const accounts = JSON.parse(localStorage.getItem('userAccounts') || '{}');
    if (accounts[user.email]) {
      accounts[user.email].profileImage = imageData;
      localStorage.setItem('userAccounts', JSON.stringify(accounts));

      // Update session storage
      sessionStorage.setItem('currentUser', JSON.stringify(user));

      // Track activity
      window.UserAccount.trackActivity(user.id, 'profile_updated', 'Profile picture updated');
    }
  }
}

function loadProfileImage(user) {
  if (user && user.profileImage) {
    displayProfileImage(user.profileImage);
  }
}

// Remove profile image functionality
function removeProfileImage() {
  const user = window.UserAccount.getCurrentUser();
  if (user) {
    // Remove from user data
    delete user.profileImage;

    // Save to localStorage
    const accounts = JSON.parse(localStorage.getItem('userAccounts') || '{}');
    if (accounts[user.email]) {
      delete accounts[user.email].profileImage;
      localStorage.setItem('userAccounts', JSON.stringify(accounts));

      // Update session storage
      sessionStorage.setItem('currentUser', JSON.stringify(user));
    }

    // Reset display
    const profileImage = document.getElementById('userProfileImage');
    const userInitials = document.getElementById('userInitials');

    if (profileImage && userInitials) {
      profileImage.style.display = 'none';
      userInitials.style.display = 'block';
    }

    // Track activity
    window.UserAccount.trackActivity(user.id, 'profile_updated', 'Profile picture removed');
  }
}

// Make functions globally available
window.removeProfileImage = removeProfileImage;