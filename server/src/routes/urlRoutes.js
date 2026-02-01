const express = require('express');
const router = express.Router();
const { shortenUrl, getUserUrls, deleteUrl, getAdFormats } = require('../controllers/urlController');
const authMiddleware = require('../middleware/authMiddleware').protect;
const { optionalAuth } = require('../middleware/optionalAuth');

// Public route to get ad formats (so users can see rates before signing up)
router.get('/formats', getAdFormats);

// Protected routes
router.post('/shorten', optionalAuth, shortenUrl); // Optional auth so guests can shorten too (without earning)
router.get('/my-urls', authMiddleware, getUserUrls);
router.delete('/:id', authMiddleware, deleteUrl);

module.exports = router;