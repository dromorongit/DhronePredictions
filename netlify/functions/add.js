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

// Helper function to write data
async function writeDataFile(category, data) {
  await loadData();
  console.log('Writing data for category:', category, 'Data length:', data.length);
  dataStore[category] = data;
  await saveData();
  console.log('Data written successfully');
}

// Export for Netlify Functions
exports.handler = async (event, context) => {
  console.log('Add function called:', event.httpMethod, event.path);
  console.log('Event body:', event.body);

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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('=== /api/add REQUEST RECEIVED ===');
    console.log('Request method:', event.httpMethod);
    console.log('Request URL:', event.path);
    console.log('Request body:', event.body);
    console.log('Request body type:', typeof event.body);

    let body;
    try {
      // Handle both string and object bodies
      if (typeof event.body === 'string') {
        let cleanBody = event.body.trim();
        console.log('Cleaned body:', cleanBody);

        // Handle malformed JSON that starts and ends with single quotes (JavaScript object notation)
        if (cleanBody.startsWith("'") && cleanBody.endsWith("'")) {
          console.log('Detected JavaScript object notation, using regex parser');

          // Use regex to extract key-value pairs
          const obj = {};
          const regex = /(\w+):([^,]+(?:,|$))/g;
          let match;

          while ((match = regex.exec(cleanBody)) !== null) {
            const key = match[1];
            let value = match[2].replace(/,$/, '').trim(); // Remove trailing comma and trim

            // Remove quotes from value if present
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            } else if (value.startsWith("'") && value.endsWith("'")) {
              value = value.slice(1, -1);
            }

            // Clean up any trailing braces or extra characters
            value = value.replace(/[}\s]*$/, '');

            obj[key] = value;
            console.log('Parsed:', key, '=', value);
          }

          body = obj;
          console.log('Final parsed object:', body);
        } else {
          console.log('Attempting normal JSON parse');
          // Try normal JSON parsing
          body = JSON.parse(cleanBody);
        }
      } else {
        console.log('Body is not a string, using as-is');
        body = event.body;
      }
      console.log('Successfully parsed body:', body);
    } catch (e) {
      console.log('Failed to parse JSON body:', e.message);
      console.log('Raw body received:', event.body);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid JSON body', details: e.message, rawBody: event.body })
      };
    }

    const { category, league, match, date, time, prediction, odds, probability } = body;

    console.log('Extracted data:', { category, league, match, date, time, prediction, odds, probability });
    console.log('Field checks:', {
      category: !!category,
      match: !!match,
      date: !!date,
      prediction: !!prediction
    });

    if (!category || !match || !date || !prediction) {
      console.log('ERROR: Missing required fields');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Missing required fields',
          received: { category, league, match, date, time, prediction, odds, probability }
        })
      };
    }

    console.log('Category received:', category);
    console.log('Available categories:', Object.keys(CATEGORIES));

    if (!CATEGORIES[category]) {
      console.log('ERROR: Invalid category:', category);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid category' })
      };
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
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: true, prediction: newPrediction })
    };
  } catch (error) {
    console.error('Error adding prediction:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};