const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const requestIp = require('request-ip'); 

// ... (Your existing generateToken function) ...
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET is missing in environment variables!');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ... (Your existing registerUser function) ...
const registerUser = async (req, res) => {
    // ... keep existing code ...
};

// ... (Your existing loginUser function) ...
const loginUser = async (req, res) => {
    // ... keep existing code ...
};

// ... (Your existing getMe function) ...
const getMe = async (req, res) => {
  try {
    const user = await db.query('SELECT id, email, role, wallet_balance, upi_id, payment_method FROM users WHERE id = $1', [req.user.id]);
    res.json(user.rows[0]);
  } catch (err) {
    console.error('[GetMe Error]:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// [NEW FUNCTION] UPDATE PAYMENT DETAILS
const updatePaymentDetails = async (req, res) => {
  try {
    const { upiId, paymentMethod } = req.body;
    const userId = req.user.id;

    if (!upiId) {
      return res.status(400).json({ error: 'UPI ID is required' });
    }

    // Update the user's payment info in the database
    const result = await db.query(
      'UPDATE users SET upi_id = $1, payment_method = $2 WHERE id = $3 RETURNING id, email, upi_id, payment_method',
      [upiId, paymentMethod || 'UPI', userId]
    );

    res.json({
      message: 'Payment details updated successfully',
      user: result.rows[0]
    });

  } catch (err) {
    console.error('[Payment Update Error]:', err.message);
    res.status(500).json({ error: 'Server error updating payment details' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updatePaymentDetails // <--- DON'T FORGET TO EXPORT THIS
};