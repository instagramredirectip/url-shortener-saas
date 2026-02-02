const db = require('../config/db');
// Ensure this file exists in utils/generateCode.js
const generateShortCode = require('../utils/generateCode');

// 1. GET AD FORMATS
exports.getAdFormats = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, cpm_rate FROM ad_formats ORDER BY cpm_rate ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching formats' });
  }
};

// 2. CREATE SHORT URL (With Custom Alias & Monetization)
exports.createShortUrl = async (req, res) => {
  const { originalUrl, alias, adFormatId } = req.body;
  const userId = req.user.id;

  try {
    let shortCode;

    // A. Custom Alias
    if (alias && alias.trim() !== "") {
        const cleanAlias = alias.trim().replace(/[^a-zA-Z0-9-_]/g, '');
        const check = await db.query('SELECT id FROM urls WHERE short_code = $1', [cleanAlias]);
        if (check.rows.length > 0) return res.status(400).json({ error: 'Alias taken' });
        shortCode = cleanAlias;
    } else {
        // B. Random Code
        shortCode = generateShortCode(6);
        // Simple collision check
        const check = await db.query('SELECT id FROM urls WHERE short_code = $1', [shortCode]);
        if (check.rows.length > 0) shortCode = generateShortCode(6); // Retry once
    }

    // C. Monetization Logic
    let isMonetized = false;
    let finalFormatId = null;

    if (adFormatId) {
        const fmt = await db.query('SELECT cpm_rate FROM ad_formats WHERE id = $1', [adFormatId]);
        if (fmt.rows.length > 0) {
            finalFormatId = adFormatId;
            if (parseFloat(fmt.rows[0].cpm_rate) > 0) isMonetized = true;
        }
    }

    // D. Insert
    const newUrl = await db.query(
      `INSERT INTO urls (original_url, short_code, user_id, is_monetized, ad_format_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [originalUrl, shortCode, userId, isMonetized, finalFormatId]
    );

    res.json(newUrl.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 3. GET MY URLS (Correct Name for Frontend)
exports.getMyUrls = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.*, af.name as ad_format_name 
       FROM urls u 
       LEFT JOIN ad_formats af ON u.ad_format_id = af.id
       WHERE u.user_id = $1 ORDER BY u.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// 4. DELETE URL
exports.deleteUrl = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM urls WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// 5. ANALYTICS
exports.getUrlAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as count
      FROM impressions WHERE url_id = $1 GROUP BY date ORDER BY date ASC
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};