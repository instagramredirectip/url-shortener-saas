const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Helper: Generate Token with Safety Check
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET is missing in environment variables!');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// 1. REGISTER
const registerUser = async (req, res) => {
  const { email, password } = req.body;
  console.log(`[Register] Attempting for: ${email}`);

  try {
    // Check DB Connection
    if (!db) throw new Error('Database connection object is undefined');

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
      wallet_balance: user.wallet_balance || 0,
      token: generateToken(user.id),
    });
  } catch (err) {
    console.error('[Register Error]:', err.message);
    console.error(err.stack); // Print full error trace
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
};

// 2. LOGIN (With Debug Logs)
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log(`[Login] Attempting login for: ${email}`);

  try {
    // 1. Check if user exists
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      console.log('[Login] User not found');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    console.log('[Login] User found. ID:', user.id);

    // 2. Check Password Hash
    if (!user.password || !user.password.startsWith('$2')) {
      console.error('[Login] CRITICAL: Stored password is NOT a valid bcrypt hash!');
      return res.status(500).json({ error: 'Account data corrupted (Invalid Password Hash)' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('[Login] Password incorrect');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 3. Generate Token
    const token = generateToken(user.id);
    console.log('[Login] Token generated successfully');

    res.json({
      id: user.id,
      email: user.email,
      role: user.role || 'user', 
      wallet_balance: user.wallet_balance || 0,
      token: token,
    });

  } catch (err) {
    console.error('[Login Crash]:', err.message);
    console.error(err.stack); // This prints the REAL reason to the logs
    res.status(500).json({ error: `Login failed: ${err.message}` });
  }
};

// 3. GET ME
const getMe = async (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    console.error('[GetMe Error]:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe
};