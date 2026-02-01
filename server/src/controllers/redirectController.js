const db = require('../config/db');

const redirectUrl = async (req, res) => {
  try {
    const { code } = req.params;
    
    // 1. Fetch URL and Ad Details
    const result = await db.query(
      `SELECT u.*, 
              af.js_code_snippet, 
              af.display_name,
              ar.cpm_rate_inr
       FROM urls u
       LEFT JOIN ad_formats af ON u.ad_format_id = af.id
       LEFT JOIN ad_rates ar ON af.id = ar.ad_format_id
       WHERE u.short_code = $1`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('<h1>404 - Link Not Found</h1>');
    }

    const urlData = result.rows[0];

    // 2. Direct Redirect (No Monetization)
    if (!urlData.is_monetized || !urlData.js_code_snippet) {
      await db.query('UPDATE urls SET click_count = click_count + 1 WHERE id = $1', [urlData.id]);
      return res.redirect(urlData.original_url);
    }

    // 3. Monetized Redirect (Show Ad Page)
    // Record Impression Logic
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Check 24h cooldown
    const existingView = await db.query(
      `SELECT id FROM impressions 
       WHERE url_id = $1 AND visitor_ip = $2 
       AND created_at > NOW() - INTERVAL '24 hours'`,
      [urlData.id, ip]
    );

    if (existingView.rows.length === 0) {
       // Unique View: Add Money
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
    
    // Increment Click Count
    await db.query('UPDATE urls SET click_count = click_count + 1 WHERE id = $1', [urlData.id]);

    // 4. Serve HTML Page
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Loading...</title>
        <script src="https://cdn.tailwindcss.com"></script>
        ${urlData.js_code_snippet} 
      </head>
      <body class="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center font-sans">
        <div class="bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-slate-700">
           <h2 class="text-xl font-bold mb-4">Please Wait...</h2>
           <div id="timer" class="text-4xl font-bold text-green-400 mb-4">5</div>
           <a id="btn" href="${urlData.original_url}" class="hidden w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg">Get Link</a>
        </div>
        <script>
          let time = 5;
          const timer = document.getElementById('timer');
          const btn = document.getElementById('btn');
          const interval = setInterval(() => {
            time--;
            timer.innerText = time;
            if (time <= 0) {
              clearInterval(interval);
              timer.style.display = 'none';
              btn.classList.remove('hidden');
              // Auto click for popunders
              btn.click();
            }
          }, 1000);
        </script>
      </body>
      </html>
    `);

  } catch (err) {
    console.error('Redirect Error:', err);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = { redirectUrl };