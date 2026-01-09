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