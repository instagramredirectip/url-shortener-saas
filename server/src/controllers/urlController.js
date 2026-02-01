const db = require('../config/db');
const { validateUrl } = require('../utils/validation');

// 1. GET AD FORMATS (For the Dashboard Dropdown)
const getAdFormats = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT af.id, af.display_name, af.description, ar.cpm_rate_inr
      FROM ad_formats af
      JOIN ad_rates ar ON af.id = ar.ad_format_id
      WHERE af.is_active = TRUE
      ORDER BY ar.cpm_rate_inr DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching ad formats' });
  }
};

// 2. CREATE SHORT URL (Renamed to match Routes)
const createShortUrl = async (req, res) => {
  const { originalUrl, alias, adFormatId } = req.body;
  const userId = req.user ? req.user.id : null;

  if (!validateUrl(originalUrl)) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    let shortCode;
    // Custom Alias Logic
    if (alias) {
      const existing = await db.query('SELECT id FROM urls WHERE short_code = $1', [alias]);
      if (existing.rows.length > 0) return res.status(400).json({ error: 'Alias already exists' });
      shortCode = alias;
    } else {
      shortCode = Math.random().toString(36).substring(2, 8);
    }

    // Monetization Logic
    let isMonetized = false;
    let finalAdFormatId = null;

    if (userId && adFormatId) {
       isMonetized = true;
       finalAdFormatId = adFormatId;
    }

    const newUrl = await db.query(
      `INSERT INTO urls (original_url, short_code, user_id, is_monetized, ad_format_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [originalUrl, shortCode, userId, isMonetized, finalAdFormatId]
    );

    res.json(newUrl.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 3. GET MY URLS
const getMyUrls = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM urls WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4. GET URL ANALYTICS
const getUrlAnalytics = async (req, res) => {
  const { id } = req.params;
  try {
    const urlCheck = await db.query('SELECT * FROM urls WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (urlCheck.rows.length === 0) return res.status(404).json({ error: 'URL not found' });

    const result = await db.query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as count
      FROM impressions
      WHERE url_id = $1
      GROUP BY date
      ORDER BY date ASC
    `, [id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 5. DELETE URL
const deleteUrl = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM urls WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'URL not found' });
    res.json({ message: 'URL deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { 
  createShortUrl, 
  getMyUrls, 
  deleteUrl, 
  getAdFormats, 
  getUrlAnalytics 
};