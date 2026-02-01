const db = require('../config/db');

exports.redirectUrl = async (req, res) => {
  try {
    const { code } = req.params;

    // 1. Fetch URL + Ad Details
    const query = `
      SELECT u.id, u.original_url, u.is_active, u.is_monetized, u.user_id, u.ad_format_id,
             af.js_code_snippet, 
             ar.cpm_rate_inr
      FROM urls u
      LEFT JOIN ad_formats af ON u.ad_format_id = af.id
      LEFT JOIN ad_rates ar ON af.id = ar.ad_format_id
      WHERE u.short_code = $1
    `;
    
    const result = await db.query(query, [code]);
    const urlData = result.rows[0];

    // 2. Handle Not Found
    if (!urlData) return res.status(404).send('<h1>404 - Link Not Found</h1>');
    if (!urlData.is_active) return res.status(410).send('<h1>Link Disabled</h1>');

    // 3. Logic: If NOT monetized (or ad script missing), redirect immediately
    // This PREVENTS THE BLANK PAGE if the ad script is broken/null
    if (!urlData.is_monetized || !urlData.js_code_snippet) {
      await db.query('UPDATE urls SET click_count = click_count + 1 WHERE id = $1', [urlData.id]);
      return res.redirect(urlData.original_url);
    }

    // 4. Monetization Logic (Tracking)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const existingView = await db.query(
      `SELECT id FROM impressions 
       WHERE url_id = $1 AND visitor_ip = $2 
       AND created_at > NOW() - INTERVAL '24 hours'`,
      [urlData.id, ip]
    );

    // 5. Add Money (If Unique)
    if (existingView.rows.length === 0) {
      const earningAmount = parseFloat(urlData.cpm_rate_inr || 0) / 1000;
      
      await db.query(
        `INSERT INTO impressions (url_id, user_id, ad_format_id, visitor_ip, visitor_user_agent, earned_amount)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [urlData.id, urlData.user_id, urlData.ad_format_id, ip, userAgent, earningAmount]
      );

      if (urlData.user_id) {
        await db.query(
          'UPDATE users SET wallet_balance = wallet_balance + $1, total_earnings = total_earnings + $1 WHERE id = $2',
          [earningAmount, urlData.user_id]
        );
      }
    }

    // Always count the click
    await db.query('UPDATE urls SET click_count = click_count + 1 WHERE id = $1', [urlData.id]);

    // 6. Serve the "Verify Human" Page
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Check | PandaLime</title>
        <script src="https://cdn.tailwindcss.com"></script>
        
        ${urlData.js_code_snippet}
      </head>
      <body class="bg-gray-50 min-h-screen flex items-center justify-center font-sans p-4">
        
        <div class="bg-white p-8 rounded-lg shadow-xl max-w-md w-full border border-gray-200">
          <div class="mb-6 flex items-center justify-between">
             <h1 class="text-2xl font-bold text-gray-800">PandaLime</h1>
             <div class="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded">SECURE</div>
          </div>
          
          <div class="mb-8">
            <h2 class="text-xl font-semibold text-gray-800 mb-2">Verify you are human</h2>
            <p class="text-gray-500 text-sm">Please click the button below to proceed to your destination.</p>
          </div>

          <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col items-center gap-4">
            
            <a id="verify-btn" href="${urlData.original_url}" class="group relative flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all w-full justify-center">
              <span class="w-6 h-6 border-2 border-gray-300 rounded flex items-center justify-center group-hover:border-green-500 transition-colors">
                <span class="w-3 h-3 bg-green-500 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </span>
              <span>Verify & Continue</span>
            </a>

            <div class="text-[10px] text-gray-400 text-center">
              Protected by PandaLime Security.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(htmlContent);

  } catch (err) {
    console.error('[Redirect] Server Error:', err);
    res.status(500).send('Internal Server Error');
  }
};