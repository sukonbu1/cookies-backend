const pool = require('../../../common/src/config/database');

class Payment {
  static async create(paymentData) {
    const query = `
      INSERT INTO payments (
        order_id, amount, payment_method, status, transaction_id, created_at
      )
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const values = [
      paymentData.order_id,
      paymentData.amount,
      paymentData.payment_method,
      paymentData.status || 'pending',
      paymentData.transaction_id
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findById(paymentId) {
    const query = 'SELECT * FROM payments WHERE payment_id = $1';
    const { rows } = await pool.query(query, [paymentId]);
    return rows[0] || null;
  }

  static async findAll(filters = {}, pagination = {}) {
    let query = 'SELECT * FROM payments';
    const values = [];
    const conditions = [];
    if (filters.order_id) {
      values.push(filters.order_id);
      conditions.push(`order_id = $${values.length}`);
    }
    if (filters.status) {
      values.push(filters.status);
      conditions.push(`status = $${values.length}`);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';
    // Pagination
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const offset = (page - 1) * limit;
    query += ` OFFSET $${values.length + 1} LIMIT $${values.length + 2}`;
    values.push(offset, limit);
    const { rows } = await pool.query(query, values);
    return rows;
  }

  static async update(paymentId, updateData) {
    const setClause = Object.keys(updateData)
      .map((key, idx) => `${key} = $${idx + 2}`)
      .join(', ');
    const query = `
      UPDATE payments
      SET ${setClause}
      WHERE payment_id = $1
      RETURNING *
    `;
    const values = [paymentId, ...Object.values(updateData)];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async delete(paymentId) {
    const query = 'DELETE FROM payments WHERE payment_id = $1 RETURNING *';
    const { rows } = await pool.query(query, [paymentId]);
    return rows.length > 0;
  }
}

module.exports = Payment; 