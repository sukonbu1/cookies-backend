const pool = require('../../../common/src/config/database');

class Order {
  static async create(orderData) {
    const query = `
      INSERT INTO orders (
        user_id, order_number, total_amount, subtotal, tax_amount, shipping_amount, discount_amount, currency, payment_method, payment_status, shipping_method, shipping_status, order_status, tracking_number, notes, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const values = [
      orderData.user_id,
      orderData.order_number,
      orderData.total_amount,
      orderData.subtotal,
      orderData.tax_amount,
      orderData.shipping_amount,
      orderData.discount_amount,
      orderData.currency || 'USD',
      orderData.payment_method,
      orderData.payment_status || 'pending',
      orderData.shipping_method,
      orderData.shipping_status || 'pending',
      orderData.order_status || 'pending',
      orderData.tracking_number,
      orderData.notes
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findById(orderId) {
    const query = 'SELECT * FROM orders WHERE order_id = $1';
    const { rows } = await pool.query(query, [orderId]);
    return rows[0] || null;
  }

  static async findAll(filters = {}, pagination = {}) {
    let query = 'SELECT * FROM orders';
    const values = [];
    const conditions = [];
    if (filters.user_id) {
      values.push(filters.user_id);
      conditions.push(`user_id = $${values.length}`);
    }
    if (filters.order_status) {
      values.push(filters.order_status);
      conditions.push(`order_status = $${values.length}`);
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

  static async update(orderId, updateData) {
    const setClause = Object.keys(updateData)
      .map((key, idx) => `${key} = $${idx + 2}`)
      .join(', ');
    const query = `
      UPDATE orders
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
      RETURNING *
    `;
    const values = [orderId, ...Object.values(updateData)];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async delete(orderId) {
    const query = 'DELETE FROM orders WHERE order_id = $1 RETURNING *';
    const { rows } = await pool.query(query, [orderId]);
    return rows.length > 0;
  }
}

module.exports = Order; 