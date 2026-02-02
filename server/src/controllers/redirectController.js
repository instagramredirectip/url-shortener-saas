const db = require('../config/db');
const { isbot } = require('isbot'); 
const requestIp = require('request-ip'); 

// --- SECURITY CONFIGURATION ---
const MAX_CLICKS_PER_IP_HOURLY = 15; 
const BAN_THRESHOLD = 20; 
const FRAUD_POINT_SELF = 2; // High penalty for self-clicking
const FRAUD_POINT_SPAM = 1; 

exports.redirectUrl = async (req, res) => {
  try {
    const { code } = req.params;

    // 1. FETCH DATA
    const query = `
      SELECT u.id, u.original_url, u.is_active, u.is_monetized, u.user_id, u.ad_format_id,
             af.js_code_snippet, ar.cpm_rate_inr,
             usr.is_banned, usr.last_login_ip, usr.fraud_score
      FROM urls u
      LEFT JOIN ad_formats af ON u.ad_format_id = af.id
      LEFT JOIN ad_rates ar ON af.id = ar.ad_format_id
      LEFT JOIN users usr ON u.user_id = usr.id
      WHERE u.short_code = $1
    `;
    
    const result = await db.query(query, [code]);
    const urlData = result.rows[0];

    // 2. BASIC VALIDATION
    if (!urlData) return res.status(404).send('<h1>404 - Link Not Found</h1>');
    if (!urlData.is_active) return res.status(410).send('<h1>Link Disabled</h1>');
    
    // 3. BLOCK ALREADY BANNED OWNERS
    if (urlData.is_banned) {
      return res.status(403).send('<h1>🚫 Account Suspended</h1><p>Link owner is banned.</p>');
    }

    // 4. NON-MONETIZED -> SKIP CHECKS
    if (!urlData.is_monetized || !urlData.js_code_snippet) {
      await db.query('UPDATE urls SET click_count = click_count + 1 WHERE id = $1', [urlData.id]);
      const safeUrl = urlData.original_url.startsWith('http') ? urlData.original_url : '/';
      return res.redirect(safeUrl);
    }

    // 5. SECURITY CHECKS
    const clientIp = requestIp.getClientIp(req); 
    const userAgent = req.headers['user-agent'] || '';
    let fraudPointsToAdd = 0;
    
    // A. Bot Detection (Redirect immediately, no ban, no pay)
    if (isbot(userAgent)) {
      return res.redirect(urlData.original_url);
    }

    // B. Self-Click Detection (The Owner is clicking)
    const isSelfClick = (urlData.last_login_ip && urlData.last_login_ip === clientIp);
    if (isSelfClick) {
       // YOU clicked your own link -> You get punished
       fraudPointsToAdd += FRAUD_POINT_SELF;
    }

    // C. Spam IP Detection (Anyone clicking too fast)
    const ipActivity = await db.query(
      `SELECT COUNT(*) FROM impressions WHERE visitor_ip = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
      [clientIp]
    );
    const recentClicks = parseInt(ipActivity.rows[0].count);
    const isSpamIP = recentClicks > MAX_CLICKS_PER_IP_HOURLY;
    
    if (isSpamIP) {
       if (isSelfClick) {
         // Owner is spamming -> Add points -> BAN
         fraudPointsToAdd += FRAUD_POINT_SPAM;
       } else {
         // Stranger is spamming -> NO POINTS -> NO BAN
         console.log(`[External Spam] IP ${clientIp} spamming link ${urlData.id}. Payment blocked, but Owner safe.`);
       }
    }

    // 6. UPDATE FRAUD SCORE (Only if it was the OWNER)
    if (fraudPointsToAdd > 0 && urlData.user_id) {
       const updateRes = await db.query(
        `UPDATE users SET fraud_score = fraud_score + $1 WHERE id = $2 RETURNING fraud_score`,
        [fraudPointsToAdd, urlData.user_id]
      );
      if (updateRes.rows[0].fraud_score >= BAN_THRESHOLD) {
        await db.query(`UPDATE users SET is_banned = TRUE WHERE id = $1`, [urlData.user_id]);
        return res.status(403).send('<h1>Link Unreachable - Security Violation</h1>');
      }
    }

    // 7. PAYOUT LOGIC
    // We pay ONLY if it's clean traffic.
    // If it's Spam (even from a stranger), we DO NOT PAY (to save your money), but we show the page.
    const isValidForPayout = !isSelfClick && !isSpamIP;

    if (isValidForPayout) {
        // Check 24h Uniqueness
        const existingView = await db.query(
            `SELECT id FROM impressions 
             WHERE url_id = $1 AND visitor_ip = $2 
             AND created_at > NOW() - INTERVAL '24 hours'`,
            [urlData.id, clientIp]
        );

        if (existingView.rows.length === 0) {
            const earningAmount = parseFloat(urlData.cpm_rate_inr || 0) / 1000;

            await db.query(
                `INSERT INTO impressions (url_id, user_id, ad_format_id, visitor_ip, visitor_user_agent, earned_amount)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [urlData.id, urlData.user_id, urlData.ad_format_id, clientIp, userAgent, earningAmount]
            );

            await db.query(
                'UPDATE users SET wallet_balance = wallet_balance + $1, total_earnings = total_earnings + $1 WHERE id = $2',
                [earningAmount, urlData.user_id]
            );
        }
    }

    // Always increment public click count
    await db.query('UPDATE urls SET click_count = click_count + 1 WHERE id = $1', [urlData.id]);

    // 8. SERVE PAGE
    const safeUrl = urlData.original_url.startsWith('http') ? urlData.original_url : '/';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PandaLime | Secure Link</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
            if (window.top !== window.self) { window.top.location = window.self.location; }
        </script>
        ${urlData.js_code_snippet}
      </head>
      <body class="bg-gray-50 min-h-screen flex items-center justify-center font-sans p-4 select-none">
        <div class="bg-white p-8 rounded-lg shadow-xl max-w-md w-full border border-gray-200">
          <div class="mb-6 flex items-center justify-between">
             <h1 class="text-2xl font-bold text-gray-800">PandaLime</h1>
             <div class="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded">SECURE</div>
          </div>
          <div class="mb-8">
            <h2 class="text-xl font-semibold text-gray-800 mb-2">Verify you are human</h2>
            <p class="text-gray-500 text-sm">Click below to proceed to destination.</p>
          </div>
          <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col items-center gap-4">
            <a id="verify-btn" href="${safeUrl}" class="flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 border border-gray-300 rounded-lg shadow-sm w-full justify-center transition-all">
              <span>Verify & Continue</span>
            </a>
            <div class="text-[10px] text-gray-400">Protected by PandaLime Security.</div>
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