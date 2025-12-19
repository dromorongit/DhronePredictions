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

// Start continuous footer stats animation
function startFooterStatsAnimation() {
  setInterval(() => {
    const stats = ['total-clients', 'total-predictions', 'satisfied-clients'];
    stats.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        let num = parseInt(element.textContent.replace(/,/g, ''));
        num += Math.floor(Math.random() * 5) + 1; // Add 1-5 randomly
        element.textContent = num.toLocaleString();
      }
    });
  }, 1000); // Update every second
}

// Sort predictions by probability (highest to lowest)
function sortPredictions() {
  const grids = document.querySelectorAll('.predictions-grid');
  grids.forEach(grid => {
    const cards = Array.from(grid.children).filter(card =>
      card.classList.contains('prediction-card')
    );
    
    cards.sort((a, b) => {
      // Extract probability values from the probability-info spans
      const probAElement = a.querySelector('.probability-info span:last-child');
      const probBElement = b.querySelector('.probability-info span:last-child');
      
      const probA = probAElement ? parseInt(probAElement.textContent.replace('%', '').replace('N/A', '0')) : 0;
      const probB = probBElement ? parseInt(probBElement.textContent.replace('%', '').replace('N/A', '0')) : 0;
      
      return probB - probA; // Highest first
    });
    
    // Clear the grid and re-append sorted cards
    cards.forEach(card => {
      grid.appendChild(card);
    });
    
    console.log('✅ Predictions sorted by probability (highest to lowest)');
  });
}

// Toggle sort functionality with better UX
let isSorted = false;
let originalOrder = [];

function toggleSort() {
  const grids = document.querySelectorAll('.predictions-grid');
  
  if (!isSorted) {
    // Store original order before sorting
    grids.forEach(grid => {
      originalOrder[grid] = Array.from(grid.children).filter(card =>
        card.classList.contains('prediction-card')
      );
    });
    
    sortPredictions();
    isSorted = true;
    
    // Update button text and show notification
    const buttons = document.querySelectorAll('.sort-button');
    buttons.forEach(button => {
      button.textContent = 'Reset Sort';
      button.style.background = '#dc3545';
    });
    
    showSortNotification('Predictions sorted by highest probability first!', 'success');
  } else {
    // Reset to original order
    grids.forEach(grid => {
      const cards = Array.from(grid.children).filter(card =>
        card.classList.contains('prediction-card')
      );
      
      // Clear grid
      cards.forEach(card => card.remove());
      
      // Re-append in original order
      if (originalOrder[grid]) {
        originalOrder[grid].forEach(card => grid.appendChild(card));
      }
    });
    
    isSorted = false;
    
    // Update button text
    const buttons = document.querySelectorAll('.sort-button');
    buttons.forEach(button => {
      button.textContent = 'Sort by Probability';
      button.style.background = '';
    });
    
    showSortNotification('Sort reset - showing predictions in original order', 'info');
  }
}

// Show sort notification
function showSortNotification(message, type = 'success') {
  // Remove existing notifications
  const existing = document.querySelector('.sort-notification');
  if (existing) {
    existing.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `sort-notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${type === 'success' ? '✅' : 'ℹ️'}</span>
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    background: ${type === 'success' ? '#28a745' : '#17a2b8'};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    max-width: 400px;
    animation: slideInRight 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }
  }, 3000);
}

// Add CSS animations
function addSortStyles() {
  if (!document.querySelector('#sort-styles')) {
    const style = document.createElement('style');
    style.id = 'sort-styles';
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      
      .sort-button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        margin-bottom: 20px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      }
      
      .sort-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
      }
      
      .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        margin-left: auto;
      }
      
      .notification-close:hover {
        opacity: 0.8;
      }
    `;
    document.head.appendChild(style);
  }
}

// Add sort button to each predictions section
function addSortButton() {
  addSortStyles();
  
  const sections = document.querySelectorAll('.predictions-section');
  sections.forEach(section => {
    // Check if button already exists
    if (section.querySelector('.sort-button')) return;
    
    const button = document.createElement('button');
    button.textContent = 'Sort by Probability';
    button.className = 'sort-button';
    button.onclick = toggleSort;
    
    const grid = section.querySelector('.predictions-grid');
    if (grid) {
      section.insertBefore(button, grid);
    }
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

    // User account functionality removed

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

    // User account functionality removed
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

      // Check legacy subscription only
      subscription = JSON.parse(localStorage.getItem('vvipSubscription'));

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

      // Check legacy subscription only
      subscription = JSON.parse(localStorage.getItem('vvipSubscription'));
      if (subscription) {
        expirationTime = subscription.expiration;
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

// Initialize all functionality when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Set current date for all updated-date elements
  setUpdatedDate();

  // Set yesterday's date for previously won tips sections
  updateYesterdayDates();

  // Set next day's date for upcoming picks sections
  updateNextDayDate();

  // Update footer statistics
  updateFooterStats();

  // Start continuous footer stats animation
  startFooterStatsAnimation();

  // Initialize VVIP functionality if on VVIP page
  if (document.querySelector('.subscription-section')) {
    initVVIPSubscription();
  }

  // Initialize won tips functionality if on pages with won tips
  if (document.querySelector('.won-tips-section')) {
    initWonTips();
  }

  // Add sort functionality to predictions sections
  if (document.querySelector('.predictions-section')) {
    addSortButton();
  }

  // Initialize draggable Telegram button
  initDraggableTelegramButton();

  console.log('✅ Dhrone Predictions website loaded successfully');
});

// Initialize draggable Telegram button functionality
function initDraggableTelegramButton() {
  const telegramBtn = document.querySelector('.floating-telegram-btn');
  if (!telegramBtn) return;

  let isDragging = false;
  let startX, startY, initialX, initialY;

  // Mouse events
  telegramBtn.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);

  // Touch events for mobile
  telegramBtn.addEventListener('touchstart', startDrag, { passive: false });
  document.addEventListener('touchmove', drag, { passive: false });
  document.addEventListener('touchend', stopDrag);

  function startDrag(e) {
    e.preventDefault();
    isDragging = true;

    const event = e.type === 'touchstart' ? e.touches[0] : e;
    startX = event.clientX;
    startY = event.clientY;

    const rect = telegramBtn.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;

    telegramBtn.classList.add('dragging');
    telegramBtn.style.cursor = 'grabbing';
  }

  function drag(e) {
    if (!isDragging) return;

    e.preventDefault();
    const event = e.type === 'touchmove' ? e.touches[0] : e;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    const newX = initialX + deltaX;
    const newY = initialY + deltaY;

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const btnWidth = telegramBtn.offsetWidth;
    const btnHeight = telegramBtn.offsetHeight;

    // Constrain to viewport bounds
    const constrainedX = Math.max(0, Math.min(newX, viewportWidth - btnWidth));
    const constrainedY = Math.max(0, Math.min(newY, viewportHeight - btnHeight));

    telegramBtn.style.left = constrainedX + 'px';
    telegramBtn.style.top = constrainedY + 'px';
    telegramBtn.style.right = 'auto';
    telegramBtn.style.transform = 'none';
  }

  function stopDrag() {
    if (!isDragging) return;

    isDragging = false;
    telegramBtn.classList.remove('dragging');
    telegramBtn.style.cursor = 'move';

    // Save position to localStorage
    const rect = telegramBtn.getBoundingClientRect();
    const position = {
      left: rect.left,
      top: rect.top
    };
    localStorage.setItem('telegramBtnPosition', JSON.stringify(position));
  }

  // Load saved position on page load
  const savedPosition = localStorage.getItem('telegramBtnPosition');
  if (savedPosition) {
    try {
      const position = JSON.parse(savedPosition);
      telegramBtn.style.left = position.left + 'px';
      telegramBtn.style.top = position.top + 'px';
      telegramBtn.style.right = 'auto';
      telegramBtn.style.transform = 'none';
    } catch (e) {
      console.warn('Failed to load saved Telegram button position');
    }
  }

  // Reset position if button goes off-screen (e.g., window resize)
  window.addEventListener('resize', () => {
    const rect = telegramBtn.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (rect.right < 0 || rect.left > viewportWidth || rect.bottom < 0 || rect.top > viewportHeight) {
      // Reset to middle right
      telegramBtn.style.left = 'auto';
      telegramBtn.style.top = '50%';
      telegramBtn.style.right = '20px';
      telegramBtn.style.transform = 'translateY(-50%)';
      localStorage.removeItem('telegramBtnPosition');
    }
  });
}