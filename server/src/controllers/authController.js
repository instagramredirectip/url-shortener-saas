const db = require('../config/db');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken'); // Ensure this path is correct

const register = async (req, res) => {
  const { email, password } = req.body;
  // Basic validation
  if (!email || !password) return res.status(400).json({ error: 'All fields required' });

  try {
    // Check if user exists
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert User
    const newUser = await db.query(
      `INSERT INTO users (email, password_hash, role, wallet_balance, total_earnings) 
       VALUES ($1, $2, 'user', 0.00, 0.00) RETURNING id, email, role`,
      [email, hashedPassword]
    );

    const user = newUser.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({ user, token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = generateToken(user.id);

    // Return user info WITHOUT password
    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        wallet_balance: user.wallet_balance, // <--- IMPORTANT
      },
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// --- NEW: Get Current User Profile (For Dashboard Refresh) ---
const getMe = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, role, wallet_balance, total_earnings, bank_account_no, upi_id FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};


// ... existing imports and functions

const updatePaymentDetails = async (req, res) => {
  const { bank_account_no, bank_ifsc, bank_holder_name, upi_id } = req.body;
  
  try {
    const updatedUser = await db.query(
      `UPDATE users 
       SET bank_account_no = $1, bank_ifsc = $2, bank_holder_name = $3, upi_id = $4 
       WHERE id = $5 
       RETURNING id, email, bank_account_no, bank_ifsc, bank_holder_name, upi_id`,
      [bank_account_no, bank_ifsc, bank_holder_name, upi_id, req.user.id]
    );

    res.json(updatedUser.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update payment details' });
  }
};

// Update module.exports to include it
module.exports = { register, login, getMe, updatePaymentDetails };