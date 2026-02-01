const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Helper: Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// 1. REGISTER
const registerUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ error: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Default role is 'user'
    const newUser = await db.query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role, wallet_balance',
      [email, hashedPassword, 'user']
    );

    const user = newUser.rows[0];
    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
      wallet_balance: user.wallet_balance,
      token: generateToken(user.id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 2. LOGIN
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    res.json({
      id: user.id,
      email: user.email,
      role: user.role, 
      wallet_balance: user.wallet_balance,
      token: generateToken(user.id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 3. GET ME
const getMe = async (req, res) => {
  try {
    // req.user is populated by authMiddleware
    res.json(req.user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// EXPORT ALL FUNCTIONS (Safe Method)
module.exports = {
  registerUser,
  loginUser,
  getMe
};