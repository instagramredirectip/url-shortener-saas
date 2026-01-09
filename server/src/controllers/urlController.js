const db = require('../config/db');
const generateShortCode = require('../utils/generateCode');
const { urlSchema } = require('../utils/validation');

// @desc    Shorten a new URL
// @route   POST /api/urls/shorten
// @access  Private (Logged in users)
exports.shortenUrl = async (req, res) => {
  try {
    // 1. Validate Input
    const { error } = urlSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { originalUrl } = req.body;
    const userId = req.user.id; // From Auth Middleware (we will add next)

    // 2. Generate Unique Code (Retry if collision occurs - highly unlikely but safe)
    let shortCode;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      shortCode = generateShortCode(6);
      // Check if code exists
      const check = await db.query('SELECT id FROM urls WHERE short_code = $1', [shortCode]);
      if (check.rows.length === 0) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ error: 'Failed to generate unique code. Please try again.' });
    }

    // 3. Save to Database
    const query = `
      INSERT INTO urls (user_id, original_url, short_code)
      VALUES ($1, $2, $3)
      RETURNING id, original_url, short_code, created_at
    `;
    
    const result = await db.query(query, [userId, originalUrl, shortCode]);
    const newUrl = result.rows[0];

    // 4. Return Result
    // We construct the full short URL for the frontend
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT}`;
    
    res.status(201).json({
      message: 'URL shortened successfully',
      data: {
        ...newUrl,
        shortUrl: `${baseUrl}/${newUrl.short_code}`
      }
    });

  } catch (err) {
    console.error('[UrlController] Error:', err);
    res.status(500).json({ error: 'Server error while shortening URL' });
  }
};

// ... existing imports ...

// ... existing shortenUrl function ...

// @desc    Get all URLs created by current user
// @route   GET /api/urls/mine
// @access  Private
exports.getMyUrls = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch URLs (newest first)
    // We also want to see the click count
    const query = `
      SELECT id, original_url, short_code, click_count, is_active, created_at 
      FROM urls 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    
    const result = await db.query(query, [userId]);
    
    // Format the response to include the full short URL
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT}`;
    
    const urls = result.rows.map(url => ({
      ...url,
      shortUrl: `${baseUrl}/${url.short_code}`
    }));

    res.json(urls);

  } catch (err) {
    console.error('[UrlController] Error fetching URLs:', err);
    res.status(500).json({ error: 'Server error while fetching URLs' });
  }
};

// ... existing code ...

// @desc    Redirect short code to original URL
// @route   GET /:code
exports.redirectUrl = async (req, res) => {
  try {
    const { code } = req.params;
    
    // 1. Find the URL in the database
    const result = await db.query(
      'SELECT id, original_url FROM urls WHERE short_code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('URL not found');
    }

    const url = result.rows[0];

    // 2. Track the click (Fire and forget - don't wait for it)
    const ip = req.ip || req.connection.remoteAddress;
    db.query('INSERT INTO clicks (url_id, ip_address) VALUES ($1, $2)', [url.id, ip]);
    db.query('UPDATE urls SET click_count = click_count + 1 WHERE id = $1', [url.id]);

    // 3. The Magic Redirect
    // 301 = Permanent, 302 = Temporary. We use 302 so we can still track clicks.
    return res.redirect(url.original_url);

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
    const userId = req.user.id; // From auth middleware

    // 1. Verify ownership (Security check)
    const urlCheck = await db.query(
      'SELECT id FROM urls WHERE id = $1 AND user_id = $2', 
      [id, userId]
    );
    
    if (urlCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // 2. Get clicks per day for last 7 days
    // This SQL magic groups clicks by date
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
    console.error(err);
    res.status(500).json({ error: 'Analytics error' });
  }
};