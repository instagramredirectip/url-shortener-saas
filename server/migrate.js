// server/migrate.js
require('dotenv').config();
const db = require('./src/config/db');

const migrationQuery = `
  -- 1. Upgrade 'users' table (Add Wallet & Bank Info)
  ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(12, 4) DEFAULT 0.0000;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(12, 4) DEFAULT 0.0000;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_no VARCHAR(50);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(20);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_holder_name VARCHAR(100);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS fraud_score INTEGER DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);

  -- 2. Create 'ad_formats' table
  CREATE TABLE IF NOT EXISTS ad_formats (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      display_name VARCHAR(100) NOT NULL,
      description TEXT,
      js_code_snippet TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE
  );

  -- 3. Create 'ad_rates' table
  CREATE TABLE IF NOT EXISTS ad_rates (
      id SERIAL PRIMARY KEY,
      ad_format_id INT REFERENCES ad_formats(id) ON DELETE CASCADE,
      cpm_rate_inr DECIMAL(10, 4) NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 4. Update 'urls' table (Add Monetization flags)
  ALTER TABLE urls ADD COLUMN IF NOT EXISTS is_monetized BOOLEAN DEFAULT FALSE;
  ALTER TABLE urls ADD COLUMN IF NOT EXISTS ad_format_id INT REFERENCES ad_formats(id);

  -- 5. Create 'impressions' table (Track Views)
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

  -- Prevent duplicate impressions/payments by creating a daily uniqueness index (defense-in-depth)
  CREATE UNIQUE INDEX IF NOT EXISTS idx_impression_unique_daily ON impressions (url_id, visitor_ip, (created_at::date));

  -- 6. Create 'payout_requests' table
  DO $$ BEGIN
      CREATE TYPE payout_status AS ENUM ('pending', 'approved', 'rejected');
  EXCEPTION
      WHEN duplicate_object THEN null;
  END $$;

  CREATE TABLE IF NOT EXISTS payout_requests (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      amount DECIMAL(12, 2) NOT NULL,  -- net amount user will receive
      status payout_status DEFAULT 'pending',
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      processed_at TIMESTAMP,
      processed_by INT REFERENCES users(id),
      admin_note TEXT
  );
  -- 7. Wallet transactions table (audit trail for all wallet changes)
  CREATE TABLE IF NOT EXISTS wallet_transactions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    change_amount DECIMAL(12,4) NOT NULL,
    balance_after DECIMAL(12,4) NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference_id INT,
    meta JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Add columns to track gross and commission amounts (existing installs)
  ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS gross_amount DECIMAL(12,2) DEFAULT 0.00;
  ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(12,2) DEFAULT 0.00;

  -- 7. Insert Default Ad Formats (Only if table is empty)
  INSERT INTO ad_formats (name, display_name, description, js_code_snippet, is_active)
  SELECT 'multitag', 'Multitag (Highest Earnings)', 'Combines multiple ad formats.', '<script src="https://quge5.com/88/tag.min.js" data-zone="207538" async data-cfasync="false"></script>', TRUE
  WHERE NOT EXISTS (SELECT 1 FROM ad_formats WHERE name = 'multitag');

  INSERT INTO ad_formats (name, display_name, description, js_code_snippet, is_active)
  SELECT 'popunder', 'Onclick Popunder', 'Opens ad in new tab.', '<script>(function(s){s.dataset.zone=''10551833'',s.src=''https://al5sm.com/tag.min.js''})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement(''script'')))</script>', TRUE
  WHERE NOT EXISTS (SELECT 1 FROM ad_formats WHERE name = 'popunder');

  -- 8. Insert Default Rates
  INSERT INTO ad_rates (ad_format_id, cpm_rate_inr)
  SELECT id, 120.00 FROM ad_formats WHERE name = 'multitag'
  AND NOT EXISTS (SELECT 1 FROM ad_rates WHERE ad_format_id = ad_formats.id);

  INSERT INTO ad_rates (ad_format_id, cpm_rate_inr)
  SELECT id, 100.00 FROM ad_formats WHERE name = 'popunder'
  AND NOT EXISTS (SELECT 1 FROM ad_rates WHERE ad_format_id = ad_formats.id);
`;

async function runMigration() {
  try {
    console.log('[Migration] Connecting to DB...');
    await db.query(migrationQuery);
    console.log('[Migration] SUCCESS! Database updated with new tables and columns.');
    process.exit(0);
  } catch (err) {
    console.error('[Migration] FAILED:', err);
    process.exit(1);
  }
}

runMigration();