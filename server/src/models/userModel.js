const db = require('../config/db');

class UserModel {
  // Find a user by email (for login/checking duplicates)
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  // Create a new user
  static async create(email, passwordHash) {
    const query = `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email, role, created_at
    `;
    const result = await db.query(query, [email, passwordHash]);
    return result.rows[0];
  }
  
  // Find user by ID (for profile dashboard)
  static async findById(id) {
    const query = 'SELECT id, email, role, created_at FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = UserModel;