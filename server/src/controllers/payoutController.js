const db = require('../config/db');

// User: Request Payout
exports.requestPayout = async (req, res) => {
  const userId = req.user.id;
  try {
    // 1. Check Balance
    const userRes = await db.query('SELECT wallet_balance FROM users WHERE id = $1', [userId]);
    const balance = parseFloat(userRes.rows[0].wallet_balance);

    if (balance < 700) {
      return res.status(400).json({ error: 'Minimum withdrawal amount is ₹700' });
    }

    // 2. Start Transaction
    await db.query('BEGIN');

    // Deduct Balance
    await db.query('UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2', [balance, userId]);

    // Create Request
    await db.query(
      'INSERT INTO payout_requests (user_id, amount, status) VALUES ($1, $2, $3)',
      [userId, balance, 'pending']
    );

    await db.query('COMMIT');
    res.json({ message: 'Payout requested successfully!' });

  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// User: Get My Payouts
exports.getMyPayouts = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM payout_requests WHERE user_id = $1 ORDER BY requested_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// --- ADMIN ONLY FUNCTIONS ---

// Admin: Get ALL Requests
exports.getAllPayouts = async (req, res) => {
  try {
    // Join with users table to get email/UPI details
    const result = await db.query(`
      SELECT p.*, u.email, u.upi_id, u.bank_holder_name 
      FROM payout_requests p
      JOIN users u ON p.user_id = u.id
      ORDER BY 
        CASE WHEN p.status = 'pending' THEN 1 ELSE 2 END, 
        p.requested_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin: Process Payout (Approve/Reject)
exports.processPayout = async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body; // status = 'approved' or 'rejected'
  
  try {
    await db.query('BEGIN');

    const request = await db.query('SELECT * FROM payout_requests WHERE id = $1', [id]);
    if (request.rows.length === 0) return res.status(404).json({ error: 'Request not found' });

    // Update Status
    await db.query(
      'UPDATE payout_requests SET status = $1, admin_note = $2, processed_at = NOW() WHERE id = $3',
      [status, note, id]
    );

    // If Rejected, Refund the money
    if (status === 'rejected') {
      await db.query(
        'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
        [request.rows[0].amount, request.rows[0].user_id]
      );
    }

    await db.query('COMMIT');
    res.json({ message: `Payout ${status}` });

  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};