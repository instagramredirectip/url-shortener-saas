const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
  let token;

  // 1. Check for token in headers (Format: "Bearer <token>")
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Add user info to request object
      req.user = decoded; 

      next(); // Move to the controller
    } catch (error) {
      console.error('[AuthMiddleware] Token failed:', error.message);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }
};