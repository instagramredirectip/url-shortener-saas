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

    // Compute commission: 30% platform fee on gross balance
    const GROSS = parseFloat(balance.toFixed(2));
    const COMMISSION = parseFloat((GROSS * 0.30).toFixed(2));
    const NET = parseFloat((GROSS - COMMISSION).toFixed(2));

    // 2. Start Transaction and lock user row to prevent concurrent withdrawals
    await db.query('BEGIN');

    // Lock user's row
    const lockRes = await db.query('SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE', [userId]);
    const lockedBalance = parseFloat(lockRes.rows[0].wallet_balance);
    if (lockedBalance < GROSS) {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct full gross balance from user wallet
    await db.query('UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2', [GROSS, userId]);

    // Create Request storing net amount as `amount` for what user will receive, and record gross/commission
    await db.query(
      'INSERT INTO payout_requests (user_id, amount, gross_amount, commission_amount, status) VALUES ($1, $2, $3, $4, $5)',
      [userId, NET, GROSS, COMMISSION, 'pending']
    );

    await db.query('COMMIT');
    res.json({ message: 'Payout requested successfully!', requested: { gross: GROSS, commission: COMMISSION, net: NET } });

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

    // Lock the payout row to avoid race conditions
    const requestRes = await db.query('SELECT * FROM payout_requests WHERE id = $1 FOR UPDATE', [id]);
    if (requestRes.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestRes.rows[0];

    // Only allow processing pending requests
    if (request.status !== 'pending') {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: 'Request already processed' });
    }

    // Update Status
    await db.query(
      'UPDATE payout_requests SET status = $1, admin_note = $2, processed_at = NOW(), processed_by = $3 WHERE id = $4',
      [status, note, req.user.id, id]
    );

    // If Rejected, Refund the gross amount (we deducted gross at request creation)
    if (status === 'rejected') {
      await db.query(
        'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
        [request.gross_amount || request.amount, request.user_id]
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