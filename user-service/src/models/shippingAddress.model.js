const pool = require('../../../common/src/config/database');

class ShippingAddress {
  static async findByUserId(user_id) {
    const query = 'SELECT * FROM shippingaddresses WHERE user_id = $1 LIMIT 1';
    const { rows } = await pool.query(query, [user_id]);
    return rows[0] || null;
  }

  static async updateByUserId(user_id, updateData) {
    const setClause = Object.keys(updateData)
      .map((key, idx) => `${key} = $${idx + 2}`)
      .join(', ');
    const query = `
      UPDATE shippingaddresses
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *
    `;
    const values = [user_id, ...Object.values(updateData)];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async create(addressData) {
    const columns = Object.keys(addressData).join(', ');
    const placeholders = Object.keys(addressData).map((_, idx) => `$${idx + 1}`).join(', ');
    const values = Object.values(addressData);
    const query = `
      INSERT INTO shippingaddresses (${columns})
      VALUES (${placeholders})
      RETURNING *
    `;
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
}

module.exports = ShippingAddress; 