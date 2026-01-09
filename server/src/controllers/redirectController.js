const db = require('../config/db');

// @desc    Redirect to original URL
// @route   GET /:code
exports.redirectUrl = async (req, res) => {
  try {
    const { code } = req.params;

    // 1. Find the URL in the database
    // We only select what we need for speed
    const query = 'SELECT id, original_url, is_active FROM urls WHERE short_code = $1';
    const result = await db.query(query, [code]);
    const url = result.rows[0];

    // 2. Handle Not Found or Inactive
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }
    if (!url.is_active) {
      return res.status(410).json({ error: 'This link has been disabled' });
    }

    // 3. Log Analytics (Fire and Forget)
    // We don't await this because we want the user to redirect FAST.
    // We capture IP, User Agent, and Referrer for the dashboard.
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const referer = req.get('Referrer');
    
    // Insert click record
    const analyticsQuery = `
      INSERT INTO url_analytics (url_id, ip_address, user_agent, referer)
      VALUES ($1, $2, $3, $4)
    `;
    db.query(analyticsQuery, [url.id, ip, userAgent, referer])
      .catch(err => console.error('[Analytics] Error logging click:', err));

    // Update global click count on the url table (optional but good for quick sorting)
    db.query('UPDATE urls SET click_count = click_count + 1 WHERE id = $1', [url.id])
      .catch(err => console.error('[Analytics] Error updating count:', err));

    // 4. Perform the Redirect
    // 301 = Permanent (Browser caches it, bad for analytics)
    // 302 = Temporary (Browser asks server every time, GOOD for analytics)
    return res.redirect(302, url.original_url);

  } catch (err) {
    console.error('[Redirect] Server Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};