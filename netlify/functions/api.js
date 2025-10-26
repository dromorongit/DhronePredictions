const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Create Express app for Netlify Functions
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Admin password (store in .env)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Categories mapping - matches your website pages
const CATEGORIES = {
  'free-tips': 'home.json',           // index.html - Free Tips
  'banker-tips': 'banker.json',       // banker-tips.html - Banker Tips
  'free-2-odds': 'free2odds.json',    // free-2-odds.html - Free 2 Odds
  'super-single': 'supersingle.json', // super-single.html - Super Single
  'double-chance': 'doublechance.json', // double-chance.html - Double Chance
  'over-1-5': 'over15.json',          // over-1-5.html - Over 1.5 Goals
  'over-2-5': 'over25.json',          // over-2-5.html - Over 2.5 Goals
  'over-under-3-5': 'overunder35.json', // over-under-3-5.html - Over/Under 3.5 Goals
  'btts-gg': 'btts.json',             // btts-gg.html - Both Teams To Score
  'over-corners': 'overcorners.json', // over-corners.html - Over/Under Corners
  'correct-scores': 'correctscores.json', // correct-scores.html - Correct Scores
  'draws': 'draws.json',              // draws.html - Draw
  'vvip': 'vvip.json'                 // vvip.html - VVIP
};

// Helper function to get data file path
function getDataFile(category) {
  const filename = CATEGORIES[category];
  if (!filename) {
    throw new Error('Invalid category');
  }
  // For Netlify Functions, use the repository root
  return path.join(process.cwd(), 'data', filename);
}

// Helper function to read JSON file
async function readDataFile(category) {
  const filePath = getDataFile(category);
  console.log('Reading file:', filePath);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('File read successfully, length:', data.length);
    return JSON.parse(data);
  } catch (error) {
    console.log('File read error:', error.message, 'Creating new file');
    // If file doesn't exist, create it with empty array
    try {
      await fs.writeFile(filePath, '[]');
      console.log('New file created successfully');
      return [];
    } catch (writeError) {
      console.error('Failed to create file:', writeError.message);
      throw writeError;
    }
  }
}

// Helper function to write JSON file
async function writeDataFile(category, data) {
  const filePath = getDataFile(category);
  console.log('Writing file:', filePath, 'Data length:', JSON.stringify(data).length);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log('File written successfully');
  } catch (error) {
    console.error('File write error:', error.message);
    throw error;
  }
}

// API Endpoints

// GET /api/:category - Get all predictions for a category
app.get('/:category', async (req, res) => {
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
app.post('/add', async (req, res) => {
  try {
    console.log('=== /api/add REQUEST RECEIVED ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { category, league, match, date, time, prediction, odds, probability } = req.body;

    console.log('Extracted data:', { category, league, match, date, time, prediction, odds, probability });

    if (!category || !match || !date || !prediction) {
      console.log('ERROR: Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Category received:', category);
    console.log('Available categories:', Object.keys(CATEGORIES));

    if (!CATEGORIES[category]) {
      console.log('ERROR: Invalid category:', category);
      return res.status(400).json({ error: 'Invalid category' });
    }

    const data = await readDataFile(category);
    console.log('Current data length:', data.length);

    // Generate new ID
    const newId = data.length > 0 ? Math.max(...data.map(item => item.id)) + 1 : 1;
    console.log('Generated new ID:', newId);

    const newPrediction = {
      id: newId,
      league: league || '',
      match,
      date,
      time: time || '',
      prediction,
      odds: odds || '',
      probability: probability || '',
      score: '',
      status: 'Pending'
    };

    data.push(newPrediction);
    console.log('Data after push:', data.length, 'items');

    await writeDataFile(category, data);

    console.log('Prediction added successfully:', newPrediction);
    console.log('=== /api/add REQUEST COMPLETED ===');
    res.json({ success: true, prediction: newPrediction });
  } catch (error) {
    console.error('Error adding prediction:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// POST /api/update - Update prediction score and status
app.post('/update', async (req, res) => {
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

// Protected admin API routes
app.get('/admin/categories', requireAuth, (req, res) => {
  res.json(Object.keys(CATEGORIES));
});

app.get('/admin/:category', requireAuth, async (req, res) => {
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
    predictions_categories: Object.keys(CATEGORIES).length
  });
});

// Export for Netlify Functions
exports.handler = async (event, context) => {
  console.log('Netlify Function called:', event.httpMethod, event.path);
  console.log('Event body:', event.body);
  console.log('Current working directory:', process.cwd());

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  // Set up the request/response objects for Express
  const { req, res } = createMockReqRes(event);

  // Handle the request with Express
  app(req, res);

  // Return the response
  return new Promise((resolve) => {
    res.on('finish', () => {
      console.log('Response:', res.statusCode, res.body);
      resolve({
        statusCode: res.statusCode,
        headers: {
          ...res.getHeaders(),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        },
        body: res.body
      });
    });
  });
};

// Helper function to create mock req/res objects
function createMockReqRes(event) {
  const req = {
    method: event.httpMethod,
    url: event.path,
    headers: event.headers,
    body: event.body,
    params: event.pathParameters || {},
    query: event.queryStringParameters || {}
  };

  let body = '';
  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader: function(name, value) { this.headers[name] = value; },
    getHeaders: function() { return this.headers; },
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.body = JSON.stringify(data); this.end(); },
    send: function(data) { this.body = data; this.end(); },
    end: function() { /* Response finished */ }
  };

  return { req, res };
}