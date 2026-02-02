-- 1. Users Table (Authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user', -- 'admin' or 'user'
    wallet_balance DECIMAL(12, 4) DEFAULT 0.0000,
    total_earnings DECIMAL(12, 4) DEFAULT 0.0000,
    bank_account_no VARCHAR(50),
    bank_ifsc VARCHAR(20),
    bank_holder_name VARCHAR(100),
    upi_id VARCHAR(100),
    fraud_score INTEGER DEFAULT 0,
    is_banned BOOLEAN DEFAULT FALSE,
    last_login_ip VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. URLs Table (The Core Feature)
CREATE TABLE IF NOT EXISTS urls (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    original_url TEXT NOT NULL,
    short_code VARCHAR(10) UNIQUE NOT NULL,
    click_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_monetized BOOLEAN DEFAULT FALSE,
    ad_format_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optimization: Index on short_code for lightning-fast lookups
CREATE INDEX IF NOT EXISTS idx_short_code ON urls(short_code);

-- 3. Clicks/Analytics Table (Reporting)
CREATE TABLE IF NOT EXISTS url_analytics (
    id SERIAL PRIMARY KEY,
    url_id INTEGER REFERENCES urls(id) ON DELETE CASCADE,
    ip_address VARCHAR(45), -- Supports IPv6
    user_agent TEXT,
    referer TEXT,
    country_code VARCHAR(5),
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optimization: Index for querying analytics by URL quickly
CREATE INDEX IF NOT EXISTS idx_analytics_url_id ON url_analytics(url_id);

-- 4. Ad Formats Table
CREATE TABLE IF NOT EXISTS ad_formats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    js_code_snippet TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Ad Rates Table
CREATE TABLE IF NOT EXISTS ad_rates (
    id SERIAL PRIMARY KEY,
    ad_format_id INT REFERENCES ad_formats(id) ON DELETE CASCADE,
    cpm_rate_inr DECIMAL(10, 4) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Impressions Table (Track Views)
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

-- 7. Payout Requests Table
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

-- Insert default ad formats if they don't exist
INSERT INTO ad_formats (name, display_name, description, js_code_snippet, is_active)
SELECT 'multitag', 'Multitag (Highest Earnings)', 'Combines multiple ad formats.', '<script src="https://quge5.com/88/tag.min.js" data-zone="207538" async data-cfasync="false"></script>', TRUE
WHERE NOT EXISTS (SELECT 1 FROM ad_formats WHERE name = 'multitag');

INSERT INTO ad_formats (name, display_name, description, js_code_snippet, is_active)
SELECT 'popunder', 'Onclick Popunder', 'Opens ad in new tab.', '<script>(function(s){s.dataset.zone=''10551833'',s.src=''https://al5sm.com/tag.min.js''})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement(''script'')))</script>', TRUE
WHERE NOT EXISTS (SELECT 1 FROM ad_formats WHERE name = 'popunder');

-- Insert default rates
INSERT INTO ad_rates (ad_format_id, cpm_rate_inr)
SELECT id, 120.00 FROM ad_formats WHERE name = 'multitag'
AND NOT EXISTS (SELECT 1 FROM ad_rates WHERE ad_format_id = ad_formats.id);

INSERT INTO ad_rates (ad_format_id, cpm_rate_inr)
SELECT id, 100.00 FROM ad_formats WHERE name = 'popunder'
AND NOT EXISTS (SELECT 1 FROM ad_rates WHERE ad_format_id = ad_formats.id);