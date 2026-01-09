-- 1. Users Table (Authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user', -- 'admin' or 'user'
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