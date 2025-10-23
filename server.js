const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Import existing bot
const { bot, pendingUsers, usedCodes, validCodes, activeSubscriptions } = require('./bot-production');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (website)
app.use(express.static('.'));

// Admin password (store in .env)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Categories mapping
const CATEGORIES = {
  home: 'home.json',
  banker: 'banker.json',
  free2odds: 'free2odds.json',
  supersingle: 'supersingle.json',
  doublechance: 'doublechance.json',
  over15: 'over15.json',
  over25: 'over25.json',
  overunder35: 'overunder35.json',
  btts: 'btts.json',
  overcorners: 'overcorners.json',
  correctscores: 'correctscores.json',
  draws: 'draws.json',
  vvip: 'vvip.json'
};

// Helper function to get data file path
function getDataFile(category) {
  const filename = CATEGORIES[category];
  if (!filename) {
    throw new Error('Invalid category');
  }
  return path.join(__dirname, 'data', filename);
}

// Helper function to read JSON file
async function readDataFile(category) {
  const filePath = getDataFile(category);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, create it with empty array
    await fs.writeFile(filePath, '[]');
    return [];
  }
}

// Helper function to write JSON file
async function writeDataFile(category, data) {
  const filePath = getDataFile(category);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// API Endpoints

// GET /api/:category - Get all predictions for a category
app.get('/api/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const data = await readDataFile(category);
    res.json(data);
  } catch (error) {
    console.error('Error reading data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/add - Add new prediction
app.post('/api/add', async (req, res) => {
  try {
    const { category, match, date, prediction } = req.body;

    if (!category || !match || !date || !prediction) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const data = await readDataFile(category);

    // Generate new ID
    const newId = data.length > 0 ? Math.max(...data.map(item => item.id)) + 1 : 1;

    const newPrediction = {
      id: newId,
      match,
      date,
      prediction,
      score: '',
      status: 'Pending'
    };

    data.push(newPrediction);
    await writeDataFile(category, data);

    res.json({ success: true, prediction: newPrediction });
  } catch (error) {
    console.error('Error adding prediction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/update - Update prediction score and status
app.post('/api/update', async (req, res) => {
  try {
    const { category, id, score, status } = req.body;

    if (!category || !id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const data = await readDataFile(category);
    const predictionIndex = data.findIndex(item => item.id == id);

    if (predictionIndex === -1) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    // Update fields
    if (score !== undefined) {
      data[predictionIndex].score = score;
    }
    if (status !== undefined) {
      data[predictionIndex].status = status;
    }

    await writeDataFile(category, data);

    res.json({ success: true, prediction: data[predictionIndex] });
  } catch (error) {
    console.error('Error updating prediction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin authentication middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).json({ error: 'Authentication required' });
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  next();
}

// Admin panel route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Protected admin API routes
app.get('/api/admin/categories', requireAuth, (req, res) => {
  res.json(Object.keys(CATEGORIES));
});

app.get('/api/admin/:category', requireAuth, async (req, res) => {
  try {
    const { category } = req.params;
    const data = await readDataFile(category);
    res.json(data);
  } catch (error) {
    console.error('Error reading admin data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    bot_status: 'running',
    predictions_categories: Object.keys(CATEGORIES).length
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Prediction Management Server running on port ${PORT}`);
  console.log(`📊 Available categories: ${Object.keys(CATEGORIES).join(', ')}`);
  console.log(`🔐 Admin password: ${ADMIN_PASSWORD}`);
});

// Export for potential use in other files
module.exports = app;