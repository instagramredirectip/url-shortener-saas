const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');
const payoutRoutes = require('./routes/payoutRoutes');

// --- FIX IS HERE: Import from 'redirectController', not 'urlController' ---
const { redirectUrl } = require('./controllers/redirectController'); 

const app = express();

// --- SECURITY CONFIGURATION (CORS) ---
const allowedOrigins = [
  'https://pandalime.com',
  'https://www.pandalime.com',
  'http://localhost:5173',
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

// Redirect Endpoint (Must be last)
// Now 'redirectUrl' will be a valid function, so this won't crash
app.get('/:code', redirectUrl);

// Health Check
app.get('/', (req, res) => {
  res.send('Panda URL Shortener API is running...');
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
});