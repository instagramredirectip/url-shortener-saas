const express = require('express');
const cors = require('cors'); // <--- Critical for custom domains
require('dotenv').config();
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');

const { redirectUrl } = require('./controllers/redirectController');
const app = express();

// ... existing imports
const payoutRoutes = require('./routes/payoutRoutes'); // <--- Import

// ... existing app.use code
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);
app.use('/api/payouts', payoutRoutes); // <--- Add this line

// --- SECURITY CONFIGURATION (CORS) ---
// This tells the backend: "It is okay to accept requests from these websites"
app.use(cors({
  origin: [
    'https://pandalime.com',       // Your live custom domain
    'https://www.pandalime.com',   // Your live custom domain (www version)
    'http://localhost:5173',       // Your local development (for testing)
    // You can also add your Render frontend URL if you want to support both:
    // 'https://url-shortener-client-xxxx.onrender.com' 
  ],
  credentials: true, // Allow cookies/headers if needed
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Middleware to parse JSON bodies
app.use(express.json());

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);

app.get('/:code', redirectUrl);

// Health Check Endpoint (To see if server is alive)
app.get('/', (req, res) => {
  res.send('Panda URL Shortener API is running...');
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
});