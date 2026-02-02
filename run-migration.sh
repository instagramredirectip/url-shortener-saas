#!/bin/bash

# Complete Database Setup & Migration Script
# Run this to fix all database issues

set -e

echo "🚀 Starting Database Migration for URL Shortener SaaS..."

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
cd /workspaces/url-shortener-saas/server
npm install

# Step 2: Create .env if it doesn't exist
echo "⚙️  Setting up environment..."
if [ ! -f .env ]; then
    cat > .env << 'EOF'
DATABASE_URL=postgresql://neondb_owner:npg_OEUrAJsqf07i@ep-small-waterfall-ahyofw0p-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
EOF
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

# Step 3: Run migration
echo "🗄️  Running database migration..."
node migrate.js

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📋 Summary of changes:"
    echo "  ✅ Added wallet_balance, total_earnings to users table"
    echo "  ✅ Added bank_account_no, bank_ifsc, bank_holder_name to users table"
    echo "  ✅ Added upi_id to users table"
    echo "  ✅ Added fraud_score, is_banned, last_login_ip to users table"
    echo "  ✅ Created ad_formats table"
    echo "  ✅ Created ad_rates table"
    echo "  ✅ Created impressions table"
    echo "  ✅ Created payout_requests table"
    echo "  ✅ Added is_monetized, ad_format_id to urls table"
    echo ""
    echo "🎉 All database fixes applied!"
    echo ""
    echo "Next steps:"
    echo "  1. npm run dev     (to start the server)"
    echo "  2. Test endpoints with your client"
else
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi
