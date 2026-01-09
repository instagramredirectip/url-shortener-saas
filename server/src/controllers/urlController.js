const db = require('../config/db');
// ✅ FIX: Changed 'generateCode' to 'generateShortCode' to match the actual filename
const { generateShortCode } = require('../utils/generateShortCode');

// @desc    Create a short URL
// @route   POST /api/urls/shorten
exports.shortenUrl = async (req, res) => {
  const { originalUrl } = req.body;
  
  if (!originalUrl) {
    return res.status(400).json({ error: 'Original URL is required' });
  }

  try {
    const shortCode = generateShortCode();
    const userId = req.user.id;

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

// @desc    Redirect short code to original URL
// @route   GET /:code
exports.redirectUrl = async (req, res) => {
  try {
    const { code } = req.params;
    
    const result = await db.query('SELECT id, original_url FROM urls WHERE short_code = $1', [code]);

    if (result.rows.length === 0) {
      return res.status(404).send('URL not found');
    }

    const url = result.rows[0];

    // Async Tracking
    const ip = req.ip || req.connection.remoteAddress;
    db.query('INSERT INTO clicks (url_id, ip_address) VALUES ($1, $2)', [url.id, ip]);
    db.query('UPDATE urls SET click_count = click_count + 1 WHERE id = $1', [url.id]);

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