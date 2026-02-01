const db = require('../config/db');

// Get Payout History
const getPayoutHistory = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM payout_requests WHERE user_id = $1 ORDER BY requested_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Request a New Payout
const requestPayout = async (req, res) => {
  const userId = req.user.id;
  const MIN_PAYOUT = 700.00;

  try {
    // 1. Start a Database Transaction (Safety First)
    await db.query('BEGIN');

    // 2. Check current balance (Locking the row to prevent race conditions)
    const userCheck = await db.query(
      'SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );

    const currentBalance = parseFloat(userCheck.rows[0].wallet_balance);

    // 3. Validation
    if (currentBalance < MIN_PAYOUT) {
      await db.query('ROLLBACK');
      return res.status(400).json({ 
        error: `Insufficient balance. Minimum payout is ₹${MIN_PAYOUT}` 
      });
    }

    // 4. Deduct Balance & Create Payout Request
    // We deduct immediately to prevent double-spending
    await db.query(
      'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
      [currentBalance, userId]
    );

    await db.query(
      `INSERT INTO payout_requests (user_id, amount, status) VALUES ($1, $2, 'pending')`,
      [userId, currentBalance]
    );

    // 5. Commit the Transaction
    await db.query('COMMIT');

    res.json({ message: 'Payout request submitted successfully!', amount: currentBalance });

  } catch (err) {
    await db.query('ROLLBACK'); // Undo everything if error
    console.error('Payout Error:', err);
    res.status(500).json({ error: 'Transaction failed' });
  }
};

module.exports = { getPayoutHistory, requestPayout };