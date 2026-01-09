const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  shortenUrl, 
  getMyUrls, 
  getUrlAnalytics, 
  deleteUrl 
} = require('../controllers/urlController');

// All these need protection (Login required)
router.post('/shorten', protect, shortenUrl);
router.get('/myurls', protect, getMyUrls);
router.get('/:id/analytics', protect, getUrlAnalytics);
router.delete('/:id', protect, deleteUrl);

module.exports = router;