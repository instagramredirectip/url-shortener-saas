const express = require('express');
const router = express.Router();
const { 
  createShortUrl, 
  getMyUrls, 
  deleteUrl, 
  getAdFormats, 
  getUrlAnalytics 
} = require('../controllers/urlController');
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuth'); // or use authMiddleware if you don't have optional

// Public/Open Routes
router.get('/formats', getAdFormats); // <--- Populates Dropdown

// Protected Routes
router.post('/shorten', optionalAuth || authMiddleware, createShortUrl);
router.get('/myurls', authMiddleware, getMyUrls);
router.delete('/:id', authMiddleware, deleteUrl);
router.get('/:id/analytics', authMiddleware, getUrlAnalytics); // <--- Fixes Stats

module.exports = router;