const db = require('../config/db');

const getClientIp = (req) => {
  return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
};

const redirectUrl = async (req, res) => {
  try {
    const { code } = req.params;
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';

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

    // 2. Logic: Monetized vs Non-Monetized
    if (!urlData.is_monetized || !urlData.is_active || !urlData.js_code_snippet) {
      // Direct redirect for non-monetized links
      await db.query('UPDATE urls SET click_count = click_count + 1 WHERE id = $1', [urlData.id]);
      return res.redirect(urlData.original_url);
    }

    // 3. FRAUD CHECK: Has this IP viewed this specific Link in the last 24 hours?
    const existingView = await db.query(
      `SELECT id FROM impressions 
       WHERE url_id = $1 AND visitor_ip = $2 
       AND created_at > NOW() - INTERVAL '24 hours'`,
      [urlData.id, ip]
    );

    let isUniqueView = existingView.rows.length === 0;

    // 4. Record Impression (If unique)
    if (isUniqueView) {
      // Calculate earnings: (CPM / 1000) = earnings per single view
      const earningAmount = parseFloat(urlData.cpm_rate_inr) / 1000;

      await db.query(
        `INSERT INTO impressions (url_id, user_id, ad_format_id, visitor_ip, visitor_user_agent, earned_amount)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [urlData.id, urlData.user_id, urlData.ad_format_id, ip, userAgent, earningAmount]
      );

      // Update User Wallet & Stats
      await db.query(
        `UPDATE users 
         SET wallet_balance = wallet_balance + $1, 
             total_earnings = total_earnings + $1 
         WHERE id = $2`,
        [earningAmount, urlData.user_id]
      );

      // Update Link click count
      await db.query('UPDATE urls SET click_count = click_count + 1 WHERE id = $1', [urlData.id]);
    }

    // 5. Serve the Intermediate Ad Page
    // We inject the selected Ad Code dynamically into the head.
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PandaLime | Secure Link</title>
        <script src="https://cdn.tailwindcss.com"></script>
        
        ${urlData.js_code_snippet}
        <style>
          .loader { border: 4px solid #f3f3f3; border-top: 4px solid #22c55e; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body class="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center font-sans">
        
        <div class="bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-slate-700">
          <div class="mb-6 flex justify-center">
             <h1 class="text-3xl font-bold text-green-400 tracking-tighter">Panda<span class="text-white">Lime</span></h1>
          </div>
          
          <h2 class="text-xl font-semibold mb-4">Your link is ready!</h2>
          <p class="text-slate-400 mb-8 text-sm">Please wait while we secure your connection...</p>

          <div id="timer-container" class="flex flex-col items-center justify-center mb-6">
            <div class="loader mb-4"></div>
            <span id="timer" class="text-2xl font-bold text-white">5</span>
            <span class="text-xs text-slate-500 mt-1">seconds</span>
          </div>

          <a id="destination-link" href="${urlData.original_url}" 
             class="hidden w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-green-500/20 flex items-center justify-center gap-2">
            <span>Get Link</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
          
          <div class="mt-6 text-xs text-slate-600">
            Protected by PandaLime Security
          </div>
        </div>

        <script>
          let timeLeft = 5;
          const timerEl = document.getElementById('timer');
          const btnEl = document.getElementById('destination-link');
          const loaderEl = document.querySelector('.loader');
          const timerContainer = document.getElementById('timer-container');

          const countdown = setInterval(() => {
            timeLeft--;
            timerEl.innerText = timeLeft;
            if (timeLeft <= 0) {
              clearInterval(countdown);
              timerContainer.classList.add('hidden');
              btnEl.classList.remove('hidden');
            }
          }, 1000);
        </script>
      </body>
      </html>
    `;

    res.send(htmlContent);

  } catch (err) {
    console.error('Redirect Error:', err);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = { redirectUrl };