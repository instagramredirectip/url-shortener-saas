const db = require('../config/db');
const { generateShortCode } = require('../utils/generateShortCode');
const geoip = require('geoip-lite');

// @desc    Create a short URL
// @route   POST /api/urls/shorten
exports.shortenUrl = async (req, res) => {
  const { originalUrl, customAlias } = req.body;
  
  if (!originalUrl) {
    return res.status(400).json({ error: 'Original URL is required' });
  }

  try {
    let shortCode;
    
    // 1. Handle Custom Alias
    if (customAlias) {
      const sanitizedAlias = customAlias.trim().replace(/[^a-zA-Z0-9-]/g, '');
      if (sanitizedAlias.length < 3 || sanitizedAlias.length > 20) {
        return res.status(400).json({ error: 'Custom alias must be 3-20 characters' });
      }
      const exists = await db.query('SELECT id FROM urls WHERE short_code = $1', [sanitizedAlias]);
      if (exists.rows.length > 0) {
        return res.status(400).json({ error: 'This alias is already taken. Try another.' });
      }
      shortCode = sanitizedAlias;
    } else {
      // 2. Generate Random Code
      shortCode = generateShortCode();
      const check = await db.query('SELECT id FROM urls WHERE short_code = $1', [shortCode]);
      if (check.rows.length > 0) {
        shortCode = generateShortCode();
      }
    }

    const userId = req.user ? req.user.id : null;

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

// @desc    Show "Verify to Proceed" Page + Analytics
// @route   GET /:code
exports.redirectUrl = async (req, res) => {
  try {
    const { code } = req.params;
    
    // 1. Find the URL
    const result = await db.query('SELECT id, original_url FROM urls WHERE short_code = $1', [code]);

    if (result.rows.length === 0) {
      return res.status(404).send('URL not found');
    }

    const url = result.rows[0];

    // --- 🌍 CAPTURE ANALYTICS 🌍 ---
    const ip = req.ip || req.connection.remoteAddress;
    const geo = geoip.lookup(ip);
    const countryCode = geo ? geo.country : 'Unknown'; 
    const userAgent = req.get('User-Agent');
    const referer = req.get('Referrer') || 'Direct';

    const analyticsQuery = `
      INSERT INTO url_analytics (url_id, ip_address, country_code, user_agent, referer) 
      VALUES ($1, $2, $3, $4, $5)
    `;
    db.query(analyticsQuery, [url.id, ip, countryCode, userAgent, referer])
      .catch(err => console.error('Analytics Insert Error:', err));

    db.query('UPDATE urls SET click_count = click_count + 1 WHERE id = $1', [url.id]);

    // 2. Serve the HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Check | PandaLime</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-FSKYLJ3GEH"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-FSKYLJ3GEH');
        </script>
        <script src="https://quge5.com/88/tag.min.js" data-zone="200271" async data-cfasync="false"></script>
        <style>
            .checkbox-spin { border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            body { background-color: #f9fafb; }
        </style>
      </head>
      <body class="flex flex-col items-center min-h-screen font-sans text-gray-800">
        <div class="w-full bg-white shadow-sm p-4 flex justify-between items-center mb-6">
            <h1 class="text-xl font-bold text-indigo-600">Panda<span class="text-gray-800">Lime</span></h1>
            <span class="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-1 rounded">SECURITY CHECK</span>
        </div>
        <div class="w-full max-w-[728px] h-[90px] bg-gray-200 border border-dashed border-gray-300 rounded mb-6 flex items-center justify-center text-gray-400 text-sm">
            Advertisement Space (Top)
        </div>
        <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full border border-gray-200">
          <h2 class="text-2xl font-semibold mb-2 text-gray-900">Verify you are human</h2>
          <p class="text-gray-500 mb-6 text-sm">Please complete the security check to access the destination link.</p>
          <div id="verify-box" onclick="startVerification()" 
               class="flex items-center p-4 border border-gray-300 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors select-none">
             <div id="checkbox-container" class="w-8 h-8 bg-white border-2 border-gray-300 rounded flex items-center justify-center mr-4">
                <svg id="checkmark" class="w-5 h-5 text-green-500 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                </svg>
                <div id="spinner" class="w-5 h-5 border-2 border-indigo-600 checkbox-spin hidden"></div>
             </div>
             <span id="status-text" class="text-lg font-medium text-gray-700">Verify to proceed</span>
          </div>
          <div class="mt-6 flex items-center justify-between text-xs text-gray-400">
             <span>PandaLime Protection</span>
             <span>ID: ${new Date().getTime().toString(36)}</span>
          </div>
        </div>
        <div class="mt-8 w-[300px] h-[250px] bg-gray-200 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-sm">
            Advertisement Space (Bottom)
        </div>
        <script>
          const destination = "${url.original_url}";
          let isVerifying = false;
          function startVerification() {
            if (isVerifying) return;
            isVerifying = true;
            const box = document.getElementById('verify-box');
            const checkbox = document.getElementById('checkbox-container');
            const spinner = document.getElementById('spinner');
            const checkmark = document.getElementById('checkmark');
            const statusText = document.getElementById('status-text');
            spinner.classList.remove('hidden');
            statusText.innerText = "Verifying...";
            setTimeout(() => {
                spinner.classList.add('hidden');
                checkmark.classList.remove('hidden');
                checkbox.classList.remove('border-gray-300');
                checkbox.classList.add('border-green-500');
                statusText.innerText = "Success! Redirecting...";
                statusText.classList.add('text-green-600');
                setTimeout(() => { window.location.href = destination; }, 500); 
            }, 800);
          }
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

// @desc    Get detailed click statistics
// @route   GET /api/urls/:id/analytics
exports.getUrlAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 1. Auth Check
    const urlCheck = await db.query('SELECT id FROM urls WHERE id = $1 AND user_id = $2', [id, userId]);
    if (urlCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // 2. Query A: Daily Clicks (Last 7 Days)
    const dailyQuery = `
      SELECT 
        TO_CHAR(created_at, 'Mon DD') as date, 
        COUNT(*) as count 
      FROM url_analytics
      WHERE url_id = $1 
      AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY TO_CHAR(created_at, 'Mon DD'), DATE(created_at)
      ORDER BY DATE(created_at) ASC;
    `;

    // 3. Query B: Country Distribution (All Time)
    const countryQuery = `
      SELECT 
        country_code, 
        COUNT(*) as count 
      FROM url_analytics 
      WHERE url_id = $1 AND country_code IS NOT NULL
      GROUP BY country_code
      ORDER BY count DESC
      LIMIT 10;
    `;

    // Run both queries concurrently
    const [dailyRes, countryRes] = await Promise.all([
      db.query(dailyQuery, [id]),
      db.query(countryQuery, [id])
    ]);

    // Return structured data
    res.json({
      daily: dailyRes.rows,
      countries: countryRes.rows
    });

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