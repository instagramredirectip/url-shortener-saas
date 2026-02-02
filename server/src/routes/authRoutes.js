const express = require('express');
const router = express.Router();
// Import the new function
const { registerUser, loginUser, getMe, updatePaymentDetails } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

// [NEW ROUTE] This fixes the 404 Error
router.put('/payment-details', protect, updatePaymentDetails); 

module.exports = router;