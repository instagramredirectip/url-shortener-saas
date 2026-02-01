const express = require('express');
const router = express.Router();
// Import controller functions
const { registerUser, loginUser, getMe } = require('../controllers/authController');
// Import middleware
const { protect } = require('../middleware/authMiddleware');

// Define Routes
router.post('/register', registerUser); // This was likely where it crashed before
router.post('/login', loginUser);
router.get('/me', protect, getMe);

module.exports = router;