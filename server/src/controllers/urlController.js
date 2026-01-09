const db = require('../config/db');
const { generateShortCode } = require('../utils/generateShortCode');

// @desc    Create a short URL
// @route   POST /api/urls/shorten
// @desc    Create a short URL (Public & Private)
// @route   POST /api/urls/shorten
exports.shortenUrl = async (req, res) => {
  const { originalUrl, customAlias } = req.body;
  
  if (!originalUrl) {
    return res.status(400).json({ error: 'Original URL is required' });
  }

  try {
    let shortCode;
    
    // 1. Handle Custom Alias (Logged-in users only usually, but logic works for both)
    if (customAlias) {
      // Sanitize: Allow only letters, numbers, and dashes
      const sanitizedAlias = customAlias.trim().replace(/[^a-zA-Z0-9-]/g, '');
      
      if (sanitizedAlias.length < 3 || sanitizedAlias.length > 20) {
        return res.status(400).json({ error: 'Custom alias must be 3-20 characters' });
      }

      // Check for collision
      const exists = await db.query('SELECT id FROM urls WHERE short_code = $1', [sanitizedAlias]);
      if (exists.rows.length > 0) {
        return res.status(400).json({ error: 'This alias is already taken. Try another.' });
      }
      
      shortCode = sanitizedAlias;
    } else {
      // 2. Generate Random Code if no custom alias
      shortCode = generateShortCode();
      
      // Tiny chance of collision, retry once if happens
      const check = await db.query('SELECT id FROM urls WHERE short_code = $1', [shortCode]);
      if (check.rows.length > 0) {
        shortCode = generateShortCode();
      }
    }

    // 3. Determine User ID (Can be NULL for anonymous)
    const userId = req.user ? req.user.id : null;

    // 4. Save to DB
    const query = `
      INSERT INTO urls (user_id, original_url, short_code)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    
    const result = await db.query(query, [userId, originalUrl, shortCode]);
    res.json(result.rows[0]);

  } catch (err) {
    console.error("Shorten Error:", err);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get all URLs for the logged-in user
// @route   GET /api/urls/myurls
exports.getMyUrls = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      'SELECT * FROM urls WHERE user_id = $1 ORDER BY created_at DESC', 
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get URLs Error:", err);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Show Ad Page then Redirect
// @route   GET /:code
exports.redirectUrl = async (req, res) => {
  try {
    // --- ⚙️ CONFIGURATION --------------------------------------
    const WAIT_TIME_SECONDS = 8; // CHANGED TO 8 SECONDS
    // -----------------------------------------------------------

    const { code } = req.params;
    
    // 1. Find the URL
    const result = await db.query('SELECT id, original_url FROM urls WHERE short_code = $1', [code]);

    if (result.rows.length === 0) {
      return res.status(404).send('URL not found');
    }

    const url = result.rows[0];

    // 2. Track the click
    const ip = req.ip || req.connection.remoteAddress;
    db.query('INSERT INTO clicks (url_id, ip_address) VALUES ($1, $2)', [url.id, ip]);
    db.query('UPDATE urls SET click_count = click_count + 1 WHERE id = $1', [url.id]);

    // 3. Serve the HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Please Wait...</title>
        <script src="https://cdn.tailwindcss.com"></script>
        
        <script src="https://quge5.com/88/tag.min.js" data-zone="200271" async data-cfasync="false"></script>

        <style>
            @keyframes pulse-slow { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }
            .ad-space { animation: pulse-slow 2s infinite; }
        </style>
      </head>
      <body class="bg-gray-50 flex flex-col items-center min-h-screen font-sans">
        
        <div class="w-full bg-white shadow-sm p-4 flex justify-between items-center mb-8">
            <h1 class="text-xl font-bold text-indigo-600">Panda<span class="text-gray-800">Lime</span></h1>
            <span class="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded">SECURE REDIRECT</span>
        </div>

        <div class="w-full max-w-[728px] h-[90px] bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg mb-8 flex items-center justify-center text-gray-400 ad-space">
            Advertisement Space (Top)
        </div>

        <div class="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full border border-gray-100 relative overflow-hidden z-10">
          <div class="absolute top-0 left-0 w-full h-1 bg-gray-100">
            <div id="progress-bar" class="h-full bg-indigo-600 transition-all ease-linear w-0" style="transition-duration: ${WAIT_TIME_SECONDS * 1000}ms;"></div>
          </div>

          <h2 class="text-2xl font-bold text-gray-800 mb-2">Redirecting...</h2>
          <p class="text-gray-500 mb-8 text-sm">Please wait while we secure your link.</p>
          
          <div class="relative flex items-center justify-center mb-8">
             <div class="text-6xl font-black text-indigo-600" id="timer">${WAIT_TIME_SECONDS}</div>
          </div>
          
          <button id="skip-btn" class="w-full bg-gray-300 text-white font-bold py-3 px-4 rounded-lg cursor-not-allowed transition-colors" disabled>
            Please Wait...
          </button>
        </div>

        <div class="mt-8 w-[300px] h-[250px] bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 ad-space">
            Advertisement Space (Bottom)
        </div>

        <p class="mt-auto mb-4 text-xs text-gray-400">Powered by Panda URL Shortener</p>

        <script>
          let count = ${WAIT_TIME_SECONDS};
          const destination = "${url.original_url}";

          const timerElement = document.getElementById('timer');
          const btnElement = document.getElementById('skip-btn');
          const progressBar = document.getElementById('progress-bar');

          // Start Progress Bar
          setTimeout(() => { progressBar.style.width = '100%'; }, 100);

          // Countdown Logic
          const countdown = setInterval(() => {
            count--;
            timerElement.innerText = count;
            
            if (count <= 0) {
              clearInterval(countdown);
              timerElement.style.display = 'none';
              btnElement.innerText = "Continue to Link";
              btnElement.classList.remove('bg-gray-300', 'cursor-not-allowed');
              btnElement.classList.add('bg-indigo-600', 'hover:bg-indigo-700', 'shadow-lg');
              btnElement.disabled = false;
              
              // Auto Redirect
              window.location.href = destination;
              
              btnElement.onclick = () => { window.location.href = destination; };
            }
          }, 1000);
        </script>
      </body>
      </html>
    `;
    
    res.send(html);

  } catch (err) {
    console.error("Redirect Error:", err);
    res.status(500).send('Server error');
  }
};

// @desc    Get click statistics for a URL (Last 7 days)
// @route   GET /api/urls/:id/analytics
exports.getUrlAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const urlCheck = await db.query('SELECT id FROM urls WHERE id = $1 AND user_id = $2', [id, userId]);
    if (urlCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const query = `
      SELECT 
        TO_CHAR(created_at, 'Mon DD') as date, 
        COUNT(*) as count 
      FROM clicks 
      WHERE url_id = $1 
      AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY TO_CHAR(created_at, 'Mon DD'), DATE(created_at)
      ORDER BY DATE(created_at) ASC;
    `;

    const result = await db.query(query, [id]);
    res.json(result.rows);

  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ error: 'Analytics error' });
  }
};

// @desc    Delete a URL
// @route   DELETE /api/urls/:id
exports.deleteUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    await db.query('DELETE FROM urls WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: 'Server error' });
  }
};