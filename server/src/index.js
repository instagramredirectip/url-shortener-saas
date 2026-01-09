const path = require('path');
// Point explicitly to the .env file in the parent directory
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const redirectRoutes = require('./routes/redirectRoutes');

const express = require('express'); // Only imported once now
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const db = require('./config/db');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes'); // This was missing

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security Headers
app.use(cors()); // CORS Handling
app.use(morgan('combined')); // Production Logging
app.use(express.json()); // JSON Parsing

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.json({
    status: 'active',
    system: 'URL Shortener API',
    timestamp: new Date().toISOString()
  });
});


app.use('/', redirectRoutes);
// Start Server
app.listen(PORT, async () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  
  // Test DB Connection
  try {
    const res = await db.query('SELECT NOW()');
    console.log(`[Database] Connected successfully! Time: ${res.rows[0].now}`);
  } catch (err) {
    console.error('[Database] Connection failed:', err.message);
    process.exit(1); // Kill server if DB fails
  }
});