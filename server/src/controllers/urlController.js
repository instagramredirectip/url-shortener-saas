const db = require('../config/db');
// Fix: Import the correct file name you confirmed exists
const generateCodeModule = require('../utils/generateShortCode');
const generateShortCode = generateCodeModule.generateShortCode || generateCodeModule;

// 1. GET AD FORMATS
const getAdFormats = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, cpm_rate FROM ad_formats ORDER BY cpm_rate ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('[AdFormat Error]:', err.message);
    res.status(500).json({ error: 'Server error fetching ad formats' });
  }
};

// 2. CREATE SHORT URL (With Custom Alias)
const createShortUrl = async (req, res) => {
  const { originalUrl, alias, adFormatId } = req.body;
  const userId = req.user ? req.user.id : null;

  if (!originalUrl) return res.status(400).json({ error: 'Original URL is required' });

  try {
    let shortCode;

    // --- CUSTOM ALIAS LOGIC ---
    if (alias && alias.trim() !== "") {
        const cleanAlias = alias.trim().replace(/[^a-zA-Z0-9-_]/g, '');
        // Check if taken
        const existing = await db.query('SELECT id FROM urls WHERE short_code = $1', [cleanAlias]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'This alias is already taken. Try another.' });
        }
        shortCode = cleanAlias;
    } 
    else {
        // Generate Random Code
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 5) {
            shortCode = typeof generateShortCode === 'function' 
                ? generateShortCode() 
                : Math.random().toString(36).substring(2, 8); 
            
            const check = await db.query('SELECT id FROM urls WHERE short_code = $1', [shortCode]);
            if (check.rows.length === 0) isUnique = true;
            attempts++;
        }
        if (!isUnique) return res.status(500).json({ error: 'Failed to generate code' });
    }

    // Monetization Logic
    let isMonetized = false;
    let finalFormatId = null;

    if (userId && adFormatId) {
        const formatRes = await db.query('SELECT cpm_rate FROM ad_formats WHERE id = $1', [adFormatId]);
        if (formatRes.rows.length > 0) {
            finalFormatId = adFormatId;
            if (parseFloat(formatRes.rows[0].cpm_rate) > 0) {
                isMonetized = true;
            }
        }
    }

    const newUrl = await db.query(
      `INSERT INTO urls (original_url, short_code, user_id, is_monetized, ad_format_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [originalUrl, shortCode, userId, isMonetized, finalFormatId]
    );

    res.json(newUrl.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating link' });
  }
};

// 3. GET MY URLS
const getMyUrls = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.*, af.name as ad_format_name 
       FROM urls u 
       LEFT JOIN ad_formats af ON u.ad_format_id = af.id
       WHERE u.user_id = $1 
       ORDER BY u.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4. DELETE URL
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

// 5. GET URL ANALYTICS (RESTORED)
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

module.exports = { 
  createShortUrl, 
  getMyUrls, 
  deleteUrl, 
  getAdFormats,
  getUrlAnalytics // <--- THIS WAS MISSING
};