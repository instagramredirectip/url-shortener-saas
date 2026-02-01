// ... imports
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware').protect;
const { register, login, getMe, updatePaymentDetails } = require('../controllers/authController');
// ...

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.put('/payment-details', authMiddleware, updatePaymentDetails); // <--- NEW ROUTE

module.exports = router;