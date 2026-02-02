const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Helper: Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// 1. REGISTER
exports.registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ error: 'User already exists' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const newUser = await db.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, wallet_balance',
      [email, hashedPassword, 'user']
    );

    const user = newUser.rows[0];
    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 2. LOGIN
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 3. GET ME (Crucial for Dashboard Loading)
exports.getMe = async (req, res) => {
  try {
    const user = await db.query(
      `SELECT id, email, role, wallet_balance, upi_id, bank_holder_name, bank_account_no, bank_ifsc, total_earnings 
       FROM users WHERE id = $1`, 
      [req.user.id]
    );
    res.json(user.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
bankHolderName, bankAccountNo, bankIfsc } = req.body;
    await db.query(
      `UPDATE users SET upi_id = $1, bank_holder_name = $2, bank_account_no = $3, bank_ifsc = $4 
       WHERE id = $5`,
      [upiId, bankHolderName, bankAccountNo, bankIfsc
    const { upiId, paymentMethod } = req.body;
    await db.query(
      'UPDATE users SET upi_id = $1, payment_method = $2 WHERE id = $3',
      [upiId, paymentMethod || 'UPI', req.user.id]
    );
    res.json({ message: 'Payment details updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};