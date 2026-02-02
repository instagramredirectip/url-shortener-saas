const db = require('../config/db');
const { isbot } = require('isbot'); // Detects Googlebot, curl, python-requests
const requestIp = require('request-ip'); // Safe IP extraction

// --- SECURITY CONFIGURATION ---
const MAX_CLICKS_PER_IP_HOURLY = 15; // >15 clicks from same IP in 1 hour = SPAM
const BAN_THRESHOLD = 20; // If user gets 20 fraud points -> AUTO BAN
const FRAUD_POINT_BOT = 0; // Bots don't ban users (too risky), just ignored
const FRAUD_POINT_SELF = 2; // Self-clicking adds 2 points
const FRAUD_POINT_SPAM = 1; // Spam traffic adds 1 point

exports.redirectUrl = async (req, res) => {
  try {
    const { code } = req.params;

    // 1. FETCH LINK & USER DATA
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
    
    // 3. BLOCK BANNED USERS IMMEDIATELY
    if (urlData.is_banned) {
      console.log(`[Blocked] Visit to banned user link: ${urlData.user_id}`);
      return res.status(403).send(`
        <div style="text-align:center; font-family:sans-serif; padding:50px;">
          <h1>🚫 Account Suspended</h1>
          <p>The owner of this link has been banned for violating our Terms of Service.</p>
        </div>
      `);
    }

    // 4. SECURITY ANALYSIS
    const clientIp = requestIp.getClientIp(req); 
    const userAgent = req.headers['user-agent'] || '';
    let fraudPointsToAdd = 0;
    let fraudReason = '';

    // A. Bot Detection
    if (isbot(userAgent)) {
      // Just redirect bots directly, no money, no fraud points (harmless)
      return res.redirect(urlData.original_url);
    }

    // B. Self-Click Detection (Matches Login IP)
    const isSelfClick = (urlData.last_login_ip && urlData.last_login_ip === clientIp);
    if (isSelfClick) {
       fraudPointsToAdd += FRAUD_POINT_SELF;
       fraudReason = 'Self-Click';
    }

    // C. Spam IP Detection (Rate Limit)
    const ipActivity = await db.query(
      `SELECT COUNT(*) FROM impressions WHERE visitor_ip = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
      [clientIp]
    );
    const recentClicks = parseInt(ipActivity.rows[0].count);
    const isSpamIP = recentClicks > MAX_CLICKS_PER_IP_HOURLY;
    
    if (isSpamIP) {
       fraudPointsToAdd += FRAUD_POINT_SPAM;
       fraudReason = 'Spam Traffic';
    }

    // 5. PUNISHMENT SYSTEM (Auto-Ban Logic)
    if (fraudPointsToAdd > 0 && urlData.user_id) {
      console.log(`[Fraud Warning] User ${urlData.user_id} | Reason: ${fraudReason} | Points: +${fraudPointsToAdd}`);
      
      // Update Fraud Score
      const updateRes = await db.query(
        `UPDATE users SET fraud_score = fraud_score + $1 WHERE id = $2 RETURNING fraud_score`,
        [fraudPointsToAdd, urlData.user_id]
      );

      // Check if they crossed the line
      const newScore = updateRes.rows[0].fraud_score;
      if (newScore >= BAN_THRESHOLD) {
        await db.query(`UPDATE users SET is_banned = TRUE WHERE id = $1`, [urlData.user_id]);
        console.log(`[🚨 USER BANNED] User ${urlData.user_id} reached fraud score ${newScore}`);
        return res.status(403).send('<h1>Link Unreachable - Security Violation</h1>');
      }
    }

    // 6. MONETIZATION DECISION
    // Pay ONLY if: Monetized + Not Self Click + Not Spam
    const shouldPay = urlData.is_monetized && urlData.js_code_snippet && !isSelfClick && !isSpamIP;

    if (!shouldPay) {
      // Valid Redirect, but $0.00 earnings
      await db.query('UPDATE urls SET click_count = click_count + 1 WHERE id = $1', [urlData.id]);
      const safeUrl = urlData.original_url.startsWith('http') ? urlData.original_url : '/';
      return res.redirect(safeUrl);
    }

    // 7. RECORD VALID EARNING
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

      // Credit User Wallet
      await db.query(
        'UPDATE users SET wallet_balance = wallet_balance + $1, total_earnings = total_earnings + $1 WHERE id = $2',
        [earningAmount, urlData.user_id]
      );
    }

    // Increment Public Click Count
    await db.query('UPDATE urls SET click_count = click_count + 1 WHERE id = $1', [urlData.id]);

    // 8. SERVE INTERMEDIATE PAGE
    const safeUrl = urlData.original_url.startsWith('http') ? urlData.original_url : '/';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Check | PandaLime</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
            // Anti-Frame Breaker
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