// repair.js
const { Pool } = require('pg');
const path = require('path');
// Load environment variables from server/.env
require('dotenv').config({ path: path.join(__dirname, 'server/.env') });

console.log('--- PANDALIME DATABASE REPAIR KIT ---');
console.log('Target Database:', process.env.DATABASE_URL ? 'FOUND' : 'MISSING (Check server/.env)');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const repairSQL = `
-- 1. FIX USERS TABLE
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(12, 4) DEFAULT 0.0000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(12, 4) DEFAULT 0.0000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_no VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_holder_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- 2. FIX AD FORMATS TABLE
CREATE TABLE IF NOT EXISTS ad_formats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    js_code_snippet TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 3. FIX AD RATES TABLE
CREATE TABLE IF NOT EXISTS ad_rates (
    id SERIAL PRIMARY KEY,
    ad_format_id INT REFERENCES ad_formats(id) ON DELETE CASCADE,
    cpm_rate_inr DECIMAL(10, 4) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. FIX URLS TABLE
ALTER TABLE urls ADD COLUMN IF NOT EXISTS is_monetized BOOLEAN DEFAULT FALSE;
ALTER TABLE urls ADD COLUMN IF NOT EXISTS ad_format_id INT REFERENCES ad_formats(id);

-- 5. FIX IMPRESSIONS & PAYOUTS
CREATE TABLE IF NOT EXISTS impressions (
    id SERIAL PRIMARY KEY,
    url_id INT REFERENCES urls(id) ON DELETE SET NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    ad_format_id INT REFERENCES ad_formats(id),
    visitor_ip VARCHAR(45),
    visitor_user_agent TEXT,
    earned_amount DECIMAL(10, 6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$ BEGIN
    CREATE TYPE payout_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS payout_requests (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    status payout_status DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by INT REFERENCES users(id),
    admin_note TEXT
);

-- 6. SEED DATA (Insert Ads if missing)
INSERT INTO ad_formats (name, display_name, description, js_code_snippet, is_active)
SELECT 'multitag', 'Multitag (Highest Earnings)', 'Combines multiple ad formats.', '<script src="https://quge5.com/88/tag.min.js" data-zone="207538" async data-cfasync="false"></script>', TRUE
WHERE NOT EXISTS (SELECT 1 FROM ad_formats WHERE name = 'multitag');

INSERT INTO ad_formats (name, display_name, description, js_code_snippet, is_active)
SELECT 'popunder', 'Onclick Popunder', 'Opens ad in new tab.', '<script>(function(s){s.dataset.zone=''10551833'',s.src=''https://al5sm.com/tag.min.js''})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement(''script'')))</script>', TRUE
WHERE NOT EXISTS (SELECT 1 FROM ad_formats WHERE name = 'popunder');

-- Link Rates
INSERT INTO ad_rates (ad_format_id, cpm_rate_inr)
SELECT id, 120.00 FROM ad_formats WHERE name = 'multitag'
AND NOT EXISTS (SELECT 1 FROM ad_rates WHERE ad_format_id = ad_formats.id);

INSERT INTO ad_rates (ad_format_id, cpm_rate_inr)
SELECT id, 100.00 FROM ad_formats WHERE name = 'popunder'
AND NOT EXISTS (SELECT 1 FROM ad_rates WHERE ad_format_id = ad_formats.id);
`;

async function runRepair() {
  try {
    console.log('[Repair] Connecting to Database...');
    await pool.query(repairSQL);
    console.log('[Repair] ✅ SUCCESS: Database tables and columns are fixed!');
  } catch (err) {
    console.error('[Repair] ❌ FAILED:', err.message);
  } finally {
    pool.end();
  }
}

runRepair();