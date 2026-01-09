const express = require('express');
const router = express.Router();
const { redirectUrl } = require('../controllers/redirectController');

// GET /:code (e.g., /abc12)
router.get('/:code', redirectUrl);

module.exports = router;