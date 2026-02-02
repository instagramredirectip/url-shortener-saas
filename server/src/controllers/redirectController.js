const db = require('../config/db');
const { isbot } = require('isbot'); 
const requestIp = require('request-ip'); 
const jwt = require('jsonwebtoken'); // Required for secure tokens

// --- SECURITY CONFIGURATION ---
const MAX_CLICKS_PER_IP_HOURLY = 15; 
const BAN_THRESHOLD = 50; 
const FRAUD_POINT_SELF = 2; 
const FRAUD_POINT_SPAM = 1; 

// 1. THE LANDING PAGE (Serve HTML + AdBlock Check)
exports.redirectUrl = async (req, res) => {
  try {
    const { code } = req.params;

    // A. FETCH DATA
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

    // B. BASIC VALIDATION
    if (!urlData) return res.status(404).send('<h1>404 - Link Not Found</h1>');
    if (!urlData.is_active) return res.status(410).send('<h1>Link Disabled</h1>');
    if (urlData.is_banned) return res.status(403).send('<h1>🚫 Account Suspended</h1>');

    // C. NON-MONETIZED -> Redirect Immediately (Skip everything)
    if (!urlData.is_monetized || !urlData.js_code_snippet) {
      await db.query('UPDATE urls SET click_count = click_count + 1 WHERE id = $1', [urlData.id]);
      const safeUrl = urlData.original_url.startsWith('http') ? urlData.original_url : '/';
      return res.redirect(safeUrl);
    }

    // D. SECURITY CHECKS
    const clientIp = requestIp.getClientIp(req); 
    const userAgent = req.headers['user-agent'] || '';
    
    // Bot? -> Bye
    if (isbot(userAgent)) return res.redirect(urlData.original_url);

    // Fraud Checks (Self/Spam)
    let isFraud = false;
    let fraudPointsToAdd = 0;

    const isSelfClick = (urlData.last_login_ip && urlData.last_login_ip === clientIp);
    if (isSelfClick) {
       fraudPointsToAdd += FRAUD_POINT_SELF;
       isFraud = true;
    }

    const ipActivity = await db.query(
      `SELECT COUNT(*) FROM impressions WHERE visitor_ip = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
      [clientIp]
    );
    if (parseInt(ipActivity.rows[0].count) > MAX_CLICKS_PER_IP_HOURLY) {
       if (isSelfClick) fraudPointsToAdd += FRAUD_POINT_SPAM;
       isFraud = true; // Mark as fraud so we don't pay
    }

    // Update Fraud Score (If Owner is guilty)
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

    // E. GENERATE PAYOUT TOKEN (Only if CLEAN)
    let payoutToken = null;
    if (!isFraud) {
       // Create a secure token that expires in 5 minutes
       payoutToken = jwt.sign({
           url_id: urlData.id,
           user_id: urlData.user_id,
           ad_format_id: urlData.ad_format_id,
           amount: parseFloat(urlData.cpm_rate_inr || 0) / 1000,
           visitor_ip: clientIp, // Lock token to this IP
           visitor_ua: userAgent
       }, process.env.JWT_SECRET, { expiresIn: '5m' });
    }

    // Always increment public click count
    await db.query('UPDATE urls SET click_count = click_count + 1 WHERE id = $1', [urlData.id]);

    // F. SERVE PAGE WITH ADBLOCK DETECTION
    const safeUrl = urlData.original_url.startsWith('http') ? urlData.original_url : '/';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PandaLime | Secure Link</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            .ad-warning { display: none; }
            .ad-warning.active { display: flex; }
            .content-area.blocked { filter: blur(4px); pointer-events: none; }
        </style>
        ${urlData.js_code_snippet}
      </head>
      <body class="bg-gray-50 min-h-screen flex flex-col items-center justify-center font-sans p-4 select-none relative">
        
        <div id="adblock-overlay" class="ad-warning absolute inset-0 z-50 bg-black/80 flex-col items-center justify-center text-white text-center p-6">
            <div class="bg-red-600 p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
            </div>
            <h2 class="text-3xl font-bold mb-2">AdBlock Detected!</h2>
            <p class="text-gray-200 mb-6 max-w-md">Our creators rely on ads to keep these links free. Please disable your AdBlocker and refresh the page to continue.</p>
            <button onclick="window.location.reload()" class="bg-white text-red-600 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition">I've Disabled It</button>
        </div>

        <div id="main-content" class="bg-white p-8 rounded-lg shadow-xl max-w-md w-full border border-gray-200 relative z-10">
          <div class="mb-6 flex items-center justify-between">
             <h1 class="text-2xl font-bold text-gray-800">PandaLime</h1>
             <div class="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded">SECURE</div>
          </div>

          <div class="mb-8">
            <h2 class="text-xl font-semibold text-gray-800 mb-2">Verify you are human</h2>
            <p class="text-gray-500 text-sm">Click below to proceed to destination.</p>
          </div>

          <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col items-center gap-4">
            <a id="verify-btn" href="${safeUrl}" class="flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 border border-gray-300 rounded-lg shadow-sm w-full justify-center transition-all opacity-50 pointer-events-none">
              <span>Loading...</span>
            </a>
            <div class="text-[10px] text-gray-400">Protected by PandaLime Security.</div>
          </div>
        </div>

        <script>
            const PAYOUT_TOKEN = "${payoutToken || ''}";

            // 1. AdBlock Detection Logic
            window.onload = async function() {
                const testAd = document.createElement('div');
                testAd.innerHTML = '&nbsp;';
                testAd.className = 'adsbox ad-placement doubleclick';
                document.body.appendChild(testAd);
                
                // Allow browser to render
                setTimeout(async () => {
                    const isBlocked = testAd.offsetHeight === 0;
                    testAd.remove();

                    if (isBlocked) {
                        // BLOCK USER
                        document.getElementById('adblock-overlay').classList.add('active');
                        document.getElementById('main-content').classList.add('blocked');
                    } else {
                        // ALLOW USER & PROCESS PAYMENT
                        enableButton();
                        if (PAYOUT_TOKEN) {
                            try {
                                await fetch('/verify-view', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ token: PAYOUT_TOKEN })
                                });
                                console.log('Impression Verified');
                            } catch (e) { console.error('Verification failed', e); }
                        }
                    }
                }, 100);
            };

            function enableButton() {
                const btn = document.getElementById('verify-btn');
                btn.classList.remove('opacity-50', 'pointer-events-none');
                btn.innerHTML = '<span>Verify & Continue</span>';
            }
        </script>
      </body>
      </html>
    `;

    res.send(htmlContent);

  } catch (err) {
    console.error('[Redirect] Server Error:', err);
    res.status(500).send('Internal Server Error');
  }
};

// 2. THE VERIFICATION API (Processes Payment)
exports.verifyView = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: 'No token' });

        // Decode & Verify
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Anti-Replay: Check IP Match (Prevents stealing tokens)
        const currentIp = requestIp.getClientIp(req);
        if (decoded.visitor_ip !== currentIp) {
            return res.status(403).json({ error: 'IP Mismatch' });
        }

        // Database Transaction: Record View & Pay
        // Check 24h Uniqueness
        const existingView = await db.query(
            `SELECT id FROM impressions 
             WHERE url_id = $1 AND visitor_ip = $2 
             AND created_at > NOW() - INTERVAL '24 hours'`,
            [decoded.url_id, decoded.visitor_ip]
        );

        if (existingView.rows.length === 0) {
            // START ATOMIC TRANSACTION: Attempt an INSERT only if no recent impression exists (prevents race/double-pay)
            await db.query('BEGIN');

            const insertRes = await db.query(
                `INSERT INTO impressions (url_id, user_id, ad_format_id, visitor_ip, visitor_user_agent, earned_amount)
                 SELECT $1, $2, $3, $4, $5, $6
                 WHERE NOT EXISTS (
                   SELECT 1 FROM impressions WHERE url_id = $7 AND visitor_ip = $8 AND created_at > NOW() - INTERVAL '24 hours'
                 ) RETURNING id`,
                [decoded.url_id, decoded.user_id, decoded.ad_format_id, decoded.visitor_ip, decoded.visitor_ua, decoded.amount, decoded.url_id, decoded.visitor_ip]
            );

            // If insert did not happen (concurrent insert), rollback and report duplicate
            if (insertRes.rows.length === 0) {
                await db.query('ROLLBACK');
                return res.json({ success: true, paid: false, reason: 'Duplicate 24h' });
            }

            // Update Wallet (safe inside same transaction) and record transaction
            const updateRes = await db.query(
                'UPDATE users SET wallet_balance = wallet_balance + $1, total_earnings = total_earnings + $1 WHERE id = $2 RETURNING wallet_balance',
                [decoded.amount, decoded.user_id]
            );

            const balanceAfter = updateRes.rows[0].wallet_balance;

            // Insert audit record for wallet change
            await db.query(
              `INSERT INTO wallet_transactions (user_id, change_amount, balance_after, type, reference_id, meta)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [decoded.user_id, decoded.amount, balanceAfter, 'impression_pay', null, JSON.stringify({ url_id: decoded.url_id, ad_format_id: decoded.ad_format_id })]
            );

            await db.query('COMMIT');
            return res.json({ success: true, paid: true });
        }

        res.json({ success: true, paid: false, reason: 'Duplicate 24h' });

    } catch (err) {
        if (err.code === '23505') { // Unique constraint violation, ignore
             await db.query('ROLLBACK');
             return res.json({ success: true, paid: false });
        }
        console.error('[Verify] Error:', err.message);
        await db.query('ROLLBACK');
        res.status(500).json({ error: 'Verification failed' });
    }
};