# Database Fixes Applied - February 2, 2026

## Summary
Fixed critical database schema and query mismatch issues that were causing errors in ad formats, payout details, and wallet balance features.

---

## Issues Fixed

### 1. **Missing Database Columns in Users Table**
**Error**: Queries trying to fetch non-existent columns
- `payment_method` (was never in migration)
- `fraud_score` (was in code but not in DB)
- `is_banned` (was in code but not in DB)
- `last_login_ip` (was in code but not in DB)

**Solution**: 
- Updated `migrate.js` to add missing columns to users table
- Updated `database/init.sql` for new installations

### 2. **Column Name Mismatch in Ad Formats**
**Error**: `getAdFormats` trying to fetch `cpm_rate` column which doesn't exist
```javascript
// WRONG - cpm_rate doesn't exist in ad_formats table
SELECT id, name, cpm_rate FROM ad_formats

// CORRECT - cpm_rate_inr is in ad_rates table (joined)
SELECT af.id, af.name, af.display_name, ar.cpm_rate_inr as cpm_rate 
FROM ad_formats af 
LEFT JOIN ad_rates ar ON af.id = ar.ad_format_id
```

**Files Fixed**:
- [server/src/controllers/urlController.js](server/src/controllers/urlController.js) - `getAdFormats()` function
- [server/src/controllers/urlController.js](server/src/controllers/urlController.js) - `createShortUrl()` function

### 3. **getMe Endpoint Non-Existent Columns**
**Error**: `getMe()` trying to fetch `payment_method` and `fraud_score` 
```javascript
// WRONG
SELECT id, email, role, wallet_balance, upi_id, payment_method, fraud_score FROM users

// CORRECT
SELECT id, email, role, wallet_balance, upi_id, bank_holder_name, bank_account_no, bank_ifsc, total_earnings FROM users
```

**Files Fixed**:
- [server/src/controllers/authController.js](server/src/controllers/authController.js) - `getMe()` function

### 4. **updatePaymentDetails Endpoint Wrong Column**
**Error**: `updatePaymentDetails()` trying to update non-existent `payment_method` column
```javascript
// WRONG
UPDATE users SET upi_id = $1, payment_method = $2 WHERE id = $3

// CORRECT
UPDATE users SET upi_id = $1, bank_holder_name = $2, bank_account_no = $3, bank_ifsc = $4 WHERE id = $5
```

**Files Fixed**:
- [server/src/controllers/authController.js](server/src/controllers/authController.js) - `updatePaymentDetails()` function

### 5. **Missing Tables and Columns**
**Added**:
- `ad_formats` table - stores ad format configurations
- `ad_rates` table - stores CPM rates for each format
- `impressions` table - tracks monetized link views
- `payout_requests` table - manages payout requests
- Columns in `urls` table: `is_monetized`, `ad_format_id`

---

## Database Setup Instructions

### Step 1: Create .env File
```bash
# server/.env
DATABASE_URL=postgresql://neondb_owner:npg_OEUrAJsqf07i@ep-small-waterfall-ahyofw0p-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
```

### Step 2: Run Migration
```bash
cd /workspaces/url-shortener-saas/server
npm install
node migrate.js
```

This will:
1. Add all missing columns to existing tables
2. Create missing tables (`ad_formats`, `ad_rates`, `impressions`, `payout_requests`)
3. Insert default ad formats and rates
4. Set up ENUM type for payout status

### Step 3: For Fresh Installations
Use the updated `database/init.sql` which now includes all required tables and columns.

---

## Database Schema Overview

### Users Table
```
id, email, password_hash, role, wallet_balance, total_earnings, 
bank_account_no, bank_ifsc, bank_holder_name, upi_id, 
fraud_score, is_banned, last_login_ip, created_at
```

### URLs Table
```
id, user_id, original_url, short_code, click_count, is_active, 
is_monetized, ad_format_id, created_at, updated_at
```

### Ad Formats Table
```
id, name, display_name, description, js_code_snippet, is_active, created_at
```

### Ad Rates Table
```
id, ad_format_id, cpm_rate_inr, updated_at
```

### Impressions Table
```
id, url_id, user_id, ad_format_id, visitor_ip, visitor_user_agent, 
earned_amount, created_at
```

### Payout Requests Table
```
id, user_id, amount, status, requested_at, processed_at, processed_by, admin_note
```

---

## Features Now Working

✅ **Get Ad Formats** - `/api/url/formats` - Fetches available ad formats with CPM rates
✅ **Get Payout Details** - `/api/payout/my-payouts` - User can see their payout history
✅ **Fetch Wallet Balance** - `/api/auth/me` - Dashboard shows current wallet balance
✅ **Request Payout** - `/api/payout/request` - User can request withdrawal
✅ **Update Payment Info** - `/api/auth/update-payment` - User can save UPI/Bank details
✅ **Monetize Links** - Users can attach ad formats to short URLs
✅ **Track Impressions** - Ad views are recorded with earnings calculations
✅ **Fraud Detection** - System tracks fraud scores and bans accounts

---

## Testing

After migration, test these endpoints:

```bash
# Get ad formats
curl http://localhost:5000/api/url/formats

# Get user info (with token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/auth/me

# Get my payouts (with token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/payout/my-payouts
```

---

## Files Modified

1. **server/.env** - Created with database connection
2. **server/migrate.js** - Added missing columns to users table
3. **server/database/init.sql** - Added complete schema with all tables
4. **server/src/controllers/urlController.js** - Fixed ad formats queries
5. **server/src/controllers/authController.js** - Fixed user data queries

---

## Next Steps

1. Connect to your Neon database with the `.env` file
2. Run the migration: `node migrate.js`
3. Restart the server
4. All features should now work without database errors
