const express = require('express');
const router = express.Router();
const { requestPayout, getPayoutHistory } = require('../controllers/payoutController');
const authMiddleware = require('../middleware/authMiddleware').protect;

// All payout routes require login
router.get('/history', authMiddleware, getPayoutHistory);
router.post('/request', authMiddleware, requestPayout);

module.exports = router;