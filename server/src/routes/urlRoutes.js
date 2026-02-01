const express = require('express');
const router = express.Router();
// Import the functions using the EXACT names exported above
const { 
  createShortUrl, 
  getMyUrls, 
  deleteUrl, 
  getAdFormats, 
  getUrlAnalytics 
} = require('../controllers/urlController');
const { protect } = require('../middleware/authMiddleware');

// Public Route (for dropdown)
router.get('/formats', getAdFormats); 

// Protected Routes
router.post('/shorten', protect, createShortUrl); // <--- Matches 'createShortUrl'
router.get('/myurls', protect, getMyUrls); // <--- Changed from '/mine' to '/myurls' to match frontend
router.delete('/:id', protect, deleteUrl);
router.get('/:id/analytics', protect, getUrlAnalytics);

module.exports = router;