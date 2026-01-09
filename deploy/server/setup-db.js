require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./src/config/db');

async function buildDatabase() {
  try {
    console.log('[Setup] Reading SQL file...');
    const sqlPath = path.join(__dirname, '../database/init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('[Setup] Running migrations...');
    await db.query(sql);

    console.log('[Setup] Database tables created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Setup] Error creating tables:', err);
    process.exit(1);
  }
}

buildDatabase();