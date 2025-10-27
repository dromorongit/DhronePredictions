// Use a shared data file for persistence across function calls
const fs = require('fs').promises;
const path = require('path');

let dataStore = {};
let dataLoaded = false;

// Load data from file on first access
async function loadData() {
  if (dataLoaded) return;

  try {
    const dataPath = path.join(process.cwd(), 'data', 'predictions.json');
    const data = await fs.readFile(dataPath, 'utf8');
    dataStore = JSON.parse(data);
    console.log('Data loaded from file, categories:', Object.keys(dataStore));
  } catch (error) {
    console.log('No existing data file, starting with empty store');
    dataStore = {};
  }

  dataLoaded = true;
}

// Save data to file
async function saveData() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'predictions.json');
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, JSON.stringify(dataStore, null, 2));
    console.log('Data saved to file');
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Force redeploy trigger: v1.2

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

// Helper function to read data
async function readDataFile(category) {
  await loadData();
  console.log('Reading data for category:', category);
  if (!dataStore[category]) {
    console.log('Category not found, initializing empty array');
    dataStore[category] = [];
  }
  console.log('Data read successfully, length:', dataStore[category].length);
  return dataStore[category];
}

// Export for Netlify Functions
exports.handler = async (event, context) => {
  console.log('Get function called:', event.httpMethod, event.path);
  console.log('Path params:', event.pathParameters);

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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const category = event.pathParameters?.splat;
  console.log('GET request for category:', category);

  if (!category) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Category parameter required' })
    };
  }

  try {
    const data = await readDataFile(category);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error reading data:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};