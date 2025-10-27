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

// Export for Netlify Functions
exports.handler = async (event, context) => {
  console.log('Admin categories function called:', event.httpMethod, event.path);

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
};