const express = require('express');
const router = express.Router();
const { redirectUrl, verifyView } = require('../controllers/redirectController');

// Main Redirect Page
router.get('/:code', redirectUrl);

// New Verification API (For AdBlock checks & Payouts)
router.post('/verify-view', verifyView);

module.exports = router;