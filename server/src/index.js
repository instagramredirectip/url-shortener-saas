const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');
const payoutRoutes = require('./routes/payoutRoutes');

// Import redirect routes (handles intermediate page + verification)
const redirectRoutes = require('./routes/redirectRoutes');

const app = express();

// SECURITY: Basic HTTP hardening
app.use(helmet());

// --- SECURITY CONFIGURATION (CORS) ---
const allowedOrigins = [
  'https://pandalime.com',       // Dashboard (Frontend)
  'https://www.pandalime.com',   // Dashboard (www)
  'https://go.pandalime.com',    // Short Link Domain (Backend)
  'http://localhost:5173',       // Local Dev
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      console.log('BLOCKED CORS ORIGIN:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);
app.use('/api/payouts', payoutRoutes);

// Redirect & verification routes (captures go.pandalime.com/:code and /verify-view)
app.use('/', redirectRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('PandaLime API (go.pandalime.com) is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
});