const express = require('express');
const router = express.Router();
const { requestPayout, getMyPayouts, getAllPayouts, processPayout } = require('../controllers/payoutController');
const { protect } = require('../middleware/authMiddleware');

// Middleware to check if user is Admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Not authorized as admin' });
  }
};

// User Routes
router.post('/request', protect, requestPayout);
router.get('/history', protect, getMyPayouts);

// Admin Routes
router.get('/admin/all', protect, admin, getAllPayouts);
router.put('/admin/:id', protect, admin, processPayout);

module.exports = router;