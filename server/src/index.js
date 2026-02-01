const express = require('express');
const cors = require('cors'); // <--- Critical for custom domains
require('dotenv').config();
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');
const payoutRoutes = require('./routes/payoutRoutes'); // Ensure this is imported

const { redirectUrl } = require('./controllers/urlController');
const app = express();

// --- SECURITY CONFIGURATION (CORS) ---
// This enables your frontend to talk to your backend
const allowedOrigins = [
  'https://pandalime.com',       // Your custom domain
  'https://www.pandalime.com',   // Your custom domain (www)
  'http://localhost:5173',       // Local testing
  'http://localhost:3000'        // Alternate local testing
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or server-to-server)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      console.log('BLOCKED CORS ORIGIN:', origin); // <--- Logs the blocked URL in Render
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Required for cookies/sessions
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Middleware to parse JSON bodies
app.use(express.json());

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);
app.use('/api/payouts', payoutRoutes); // Add Payouts Route

// Redirect Endpoint (Must be last)
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