// Netlify Functions don't have persistent file storage
// We'll use a simple in-memory store for demo purposes
// In production, you'd use a database
let dataStore = {};

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

// Helper function to read data (using in-memory store for Netlify)
function readDataFile(category) {
  console.log('Reading data for category:', category);
  if (!dataStore[category]) {
    console.log('Category not found, initializing empty array');
    dataStore[category] = [];
  }
  console.log('Data read successfully, length:', dataStore[category].length);
  return dataStore[category];
}

// Helper function to write data (using in-memory store for Netlify)
function writeDataFile(category, data) {
  console.log('Writing data for category:', category, 'Data length:', data.length);
  dataStore[category] = data;
  console.log('Data written successfully');
}

// Export for Netlify Functions
exports.handler = async (event, context) => {
  console.log('Netlify Function called:', event.httpMethod, event.path);
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

  // Direct route handling for Netlify Functions
  let path = event.path;

  // Handle both direct function calls and redirects
  if (path.includes('/.netlify/functions/api')) {
    path = path.replace('/.netlify/functions/api', '');
  }

  const method = event.httpMethod;

  console.log('Original path:', event.path);
  console.log('Cleaned path:', path);
  console.log('Routing:', method, path);

  // Handle GET /:category
  if (method === 'GET' && path.startsWith('/')) {
    const category = path.substring(1);
    console.log('GET request for category:', category);
    try {
      const data = readDataFile(category);
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
  }

  // Handle POST /add
  if (method === 'POST' && path === '/add') {
    try {
      console.log('=== /api/add REQUEST RECEIVED ===');
      console.log('Request method:', method);
      console.log('Request URL:', path);
      console.log('Request body:', event.body);
      console.log('Request body type:', typeof event.body);

      let body;
      try {
        // Handle both string and object bodies
        if (typeof event.body === 'string') {
          let cleanBody = event.body.trim();

          // Handle malformed JSON that starts and ends with single quotes (JavaScript object notation)
          if (cleanBody.startsWith("'") && cleanBody.endsWith("'")) {
            cleanBody = cleanBody.slice(1, -1);

            // Parse JavaScript object notation manually
            const obj = {};
            console.log('Parsing body:', cleanBody);

            // Simple split by comma - this should work for our format
            const pairs = cleanBody.split(',');
            console.log('Pairs after split:', pairs);

            for (const pair of pairs) {
              console.log('Processing pair:', pair);
              // Find the first colon to separate key from value
              const colonIndex = pair.indexOf(':');
              if (colonIndex === -1) {
                console.log('No colon found in pair:', pair);
                continue;
              }

              const key = pair.substring(0, colonIndex).trim();
              let value = pair.substring(colonIndex + 1).trim();

              console.log('Key:', key, 'Value:', value);

              // Remove quotes from value if present
              if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
              } else if (value.startsWith("'") && value.endsWith("'")) {
                value = value.slice(1, -1);
              }

              obj[key] = value;
              console.log('Added to obj:', key, '=', value);
            }

            console.log('Final parsed object:', obj);

            body = obj;
          } else {
            // Try normal JSON parsing
            body = JSON.parse(cleanBody);
          }
        } else {
          body = event.body;
        }
        console.log('Parsed body:', body);
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

      const data = readDataFile(category);
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

      writeDataFile(category, data);

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
  }

  // Handle POST /update
  if (method === 'POST' && path === '/update') {
    try {
      let body;
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Invalid JSON body' })
        };
      }

      const { category, id, score, status } = body;

      if (!category || !id) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Missing required fields' })
        };
      }

      const data = readDataFile(category);
      const predictionIndex = data.findIndex(item => item.id == id);

      if (predictionIndex === -1) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Prediction not found' })
        };
      }

      // Update fields
      if (score !== undefined) {
        data[predictionIndex].score = score;
      }
      if (status !== undefined) {
        data[predictionIndex].status = status;
      }

      writeDataFile(category, data);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ success: true, prediction: data[predictionIndex] })
      };
    } catch (error) {
      console.error('Error updating prediction:', error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  }

  // Handle POST /delete
  if (method === 'POST' && path === '/delete') {
    try {
      let body;
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Invalid JSON body' })
        };
      }

      const { category, id } = body;

      if (!category || !id) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Missing required fields' })
        };
      }

      const data = readDataFile(category);
      const predictionIndex = data.findIndex(item => item.id == id);

      if (predictionIndex === -1) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Prediction not found' })
        };
      }

      // Remove the prediction
      const deletedPrediction = data.splice(predictionIndex, 1)[0];
      writeDataFile(category, data);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ success: true, prediction: deletedPrediction })
      };
    } catch (error) {
      console.error('Error deleting prediction:', error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  }

  // Handle GET /admin/categories
  if (method === 'GET' && path === '/admin/categories') {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'WWW-Authenticate': 'Basic realm="Admin Area"'
        },
        body: JSON.stringify({ error: 'Authentication required' })
      };
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    if (password !== ADMIN_PASSWORD) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(Object.keys(CATEGORIES))
    };
  }

  // Handle GET /admin/:category
  if (method === 'GET' && path.startsWith('/admin/')) {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'WWW-Authenticate': 'Basic realm="Admin Area"'
        },
        body: JSON.stringify({ error: 'Authentication required' })
      };
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    if (password !== ADMIN_PASSWORD) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    const category = path.replace('/admin/', '');
    try {
      const data = readDataFile(category);
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      };
    } catch (error) {
      console.error('Error reading admin data:', error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  }

  // Handle GET /health
  if (method === 'GET' && path === '/health') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        predictions_categories: Object.keys(CATEGORIES).length
      })
    };
  }

  // Route not found
  return {
    statusCode: 404,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ error: 'Route not found' })
  };
};
