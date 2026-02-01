const db = require('../config/db');
const { validateUrl } = require('../utils/validation');
const { generateShortCode } = require('../utils/generateShortCode');

// --- NEW: Fetch available Ad Formats & Rates for the Frontend ---
const getAdFormats = async (req, res) => {
  try {
    // We join ad_formats with ad_rates to show the user how much they will earn
    const result = await db.query(`
      SELECT 
        af.id, 
        af.display_name, 
        af.description, 
        ar.cpm_rate_inr 
      FROM ad_formats af
      JOIN ad_rates ar ON af.id = ar.ad_format_id
      WHERE af.is_active = TRUE
      ORDER BY ar.cpm_rate_inr DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching ad formats:', err);
    res.status(500).json({ error: 'Server error fetching ad formats' });
  }
};

const shortenUrl = async (req, res) => {
  const { originalUrl, alias, isMonetized, adFormatId } = req.body;
  const userId = req.user ? req.user.id : null; // From authMiddleware
  console.log('[DEBUG] Shorten URL request:', { originalUrl, alias, userId });

  // 1. Validate Original URL
  if (!validateUrl(originalUrl)) {
    console.log('[DEBUG] URL validation failed for:', originalUrl);
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    let shortCode;

    // 2. Handle Custom Alias
    if (alias) {
      if (alias.length < 3 || alias.length > 20) {
        return res.status(400).json({ error: 'Alias must be 3-20 characters' });
      }
      
      const existing = await db.query('SELECT id FROM urls WHERE short_code = $1', [alias]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Alias already taken' });
      }
      shortCode = alias;
    } else {
      // 3. Generate Random Short Code if no alias
      shortCode = generateShortCode();
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 5) {
        const existing = await db.query('SELECT id FROM urls WHERE short_code = $1', [shortCode]);
        if (existing.rows.length === 0) {
          isUnique = true;
        } else {
          shortCode = generateShortCode();
          attempts++;
        }
      }

      if (!isUnique) {
        return res.status(500).json({ error: 'Failed to generate unique code. Please try again.' });
      }
    }

    // 4. INSERT into Database (With Monetization Info)
    // We default monetization to false if not provided
    const newUrl = await db.query(
      `INSERT INTO urls (user_id, original_url, short_code, is_monetized, ad_format_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [
        userId, 
        originalUrl, 
        shortCode, 
        isMonetized || false, 
        isMonetized ? adFormatId : null // Only save format ID if monetization is on
      ]
    );

    res.status(201).json(newUrl.rows[0]);

  } catch (err) {
    console.error('Shorten Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getUserUrls = async (req, res) => {
  try {
    // Return URLs with their stats
    const result = await db.query(
      `SELECT * FROM urls WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteUrl = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ensure the URL belongs to the requesting user
    const check = await db.query('SELECT id FROM urls WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'URL not found or unauthorized' });
    }

    await db.query('DELETE FROM urls WHERE id = $1', [id]);
    res.json({ message: 'URL deleted' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { shortenUrl, getUserUrls, deleteUrl, getAdFormats };