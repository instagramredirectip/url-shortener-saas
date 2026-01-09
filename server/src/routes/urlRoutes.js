const express = require('express');
const router = express.Router();
// Import BOTH functions in a single line
const { shortenUrl, getMyUrls } = require('../controllers/urlController');
const { protect } = require('../middleware/authMiddleware');
const { shortenUrl, getMyUrls, getUrlAnalytics } = require('../controllers/urlController');

// POST /api/urls/shorten
// Protected: Only logged-in users can shorten URLs
router.post('/shorten', protect, shortenUrl);

// GET /api/urls/mine
// Protected: Get current user's history
router.get('/mine', protect, getMyUrls);
// GET /api/urls/:id/analytics
router.get('/:id/analytics', protect, getUrlAnalytics);

module.exports = router;