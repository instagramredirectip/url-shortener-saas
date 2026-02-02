const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, updatePaymentDetails } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/payment-details', protect, updatePaymentDetails);

module.exports = router;