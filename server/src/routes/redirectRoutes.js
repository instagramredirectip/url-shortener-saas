const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { redirectUrl, verifyView } = require('../controllers/redirectController');

// Apply stricter rate limit to verification endpoint to prevent abuse
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // max 30 verification attempts per minute per IP
  standardHeaders: true,
  legacyHeaders: false
});

// Main Redirect Page
router.get('/:code', redirectUrl);

// New Verification API (For AdBlock checks & Payouts)
router.post('/verify-view', verifyLimiter, verifyView);

module.exports = router;