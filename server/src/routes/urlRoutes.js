const express = require('express');
const router = express.Router();
const { 
  createShortUrl, 
  getMyUrls, 
  deleteUrl, 
  getAdFormats, 
  getUrlAnalytics 
} = require('../controllers/urlController');
const { protect } = require('../middleware/authMiddleware');

// Public
router.get('/formats', getAdFormats); 

// Protected
router.post('/shorten', protect, createShortUrl);
router.get('/myurls', protect, getMyUrls);
router.delete('/:id', protect, deleteUrl);
router.get('/:id/analytics', protect, getUrlAnalytics);

module.exports = router;