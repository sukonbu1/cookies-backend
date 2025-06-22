const pool = require('../../../common/src/config/database');
const { v4: uuidv4 } = require('uuid');

class Payment {
  static async create(paymentData, client = pool) {
    const query = `
      INSERT INTO "payments" (
        payment_id, order_id, amount, payment_method, status, transaction_id, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const values = [
      uuidv4(),
      paymentData.order_id,
      paymentData.amount,
      paymentData.payment_method,
      paymentData.status || 'pending',
      paymentData.transaction_id
    ];
    const { rows } = await client.query(query, values);
    return rows[0];
  }

  static async findById(paymentId) {
    const query = 'SELECT * FROM "payments" WHERE payment_id = $1';
    const { rows } = await pool.query(query, [paymentId]);
    return rows[0] || null;
  }

  static async findByOrderId(orderId) {
    const query = 'SELECT * FROM "payments" WHERE order_id = $1';
    const { rows } = await pool.query(query, [orderId]);
    return rows;
  }

  static async update(paymentId, updateData) {
    const setClause = Object.keys(updateData)
      .map((key, idx) => `"${key}" = $${idx + 2}`)
      .join(', ');
    const query = `
      UPDATE "payments"
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE payment_id = $1
      RETURNING *
    `;
    const values = [paymentId, ...Object.values(updateData)];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
}

module.exports = Payment; 