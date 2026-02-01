const { Pool } = require('pg');
const path = require('path');

// Try to load .env from the server directory
const envPath = path.resolve(__dirname, '../../.env');
require('dotenv').config({ path: envPath });

console.log('--- DATABASE DEBUGGING ---');
console.log('1. Looking for .env at:', envPath);
console.log('2. DATABASE_URL found?', process.env.DATABASE_URL ? 'YES' : 'NO');
if (process.env.DATABASE_URL) {
    console.log('3. URL starts with:', process.env.DATABASE_URL.substring(0, 15) + '...');
} else {
    console.log('!!! CRITICAL ERROR: DATABASE_URL is missing. Check your .env file !!!');
}
console.log('--------------------------');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon DB
  }
});

// Test the connection immediately when server starts
pool.connect((err, client, release) => {
  if (err) {
    console.error('!!! DATABASE CONNECTION FAILED !!!', err.message);
  } else {
    console.log('>>> SUCCESS: Connected to Neon Database!');
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};