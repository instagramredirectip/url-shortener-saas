const express = require('express');
const router = express.Router();
const { createShortUrl, getMyUrls, getAdFormats, deleteUrl, getUrlAnalytics } = require('../controllers/urlController');
const { protect } = require('../middleware/authMiddleware');

// Public
router.get('/formats', getAdFormats); 

// Protected
router.post('/shorten', protect, createShortUrl);
router.get('/myurls', protect, getMyUrls); // <--- Frontend calls /myurls, NOT /mine
router.delete('/:id', protect, deleteUrl);
router.get('/:id/analytics', protect, getUrlAnalytics);

module.exports = router;