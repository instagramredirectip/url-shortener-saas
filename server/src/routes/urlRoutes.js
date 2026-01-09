const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { optionalAuth } = require('../middleware/optionalAuth'); // Import new middleware
const { 
  shortenUrl, 
  getMyUrls, 
  getUrlAnalytics, 
  deleteUrl 
} = require('../controllers/urlController');

// PUBLIC/OPTIONAL ROUTE
// Use optionalAuth so we can link it to a user IF they are logged in, 
// but still allow it if they are not.
router.post('/shorten', optionalAuth, shortenUrl);

// PROTECTED ROUTES (Must be logged in)
router.get('/myurls', protect, getMyUrls);
router.get('/:id/analytics', protect, getUrlAnalytics);
router.delete('/:id', protect, deleteUrl);

module.exports = router;