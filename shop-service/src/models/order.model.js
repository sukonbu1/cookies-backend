const pool = require('../../../common/src/config/database');
const { v4: uuidv4 } = require('uuid');

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

class OrderItem {
  static async create(itemData, client = pool) {
    const query = `
      INSERT INTO "orderitems" (
        order_item_id, order_id, product_id, shop_id, variant_id, quantity, 
        unit_price, total_price, discount_amount, tax_amount, status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const values = [
      uuidv4(),
      itemData.order_id,
      itemData.product_id,
      itemData.shop_id,
      itemData.variant_id,
      itemData.quantity,
      itemData.unit_price,
      itemData.total_price,
      itemData.discount_amount || 0,
      itemData.tax_amount || 0,
      itemData.status || 'pending'
    ];
    const { rows } = await client.query(query, values);
    return rows[0];
  }

  static async findById(orderItemId) {
    const query = 'SELECT * FROM "orderitems" WHERE order_item_id = $1';
    const { rows } = await pool.query(query, [orderItemId]);
    return rows[0] || null;
  }

  static async findAll(filters = {}, pagination = {}) {
    let query = 'SELECT * FROM "orderitems"';
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

  static async update(orderItemId, updateData) {
    const setClause = Object.keys(updateData)
      .map((key, idx) => `${key} = $${idx + 2}`)
      .join(', ');
    const query = `
      UPDATE "orderitems"
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE order_item_id = $1
      RETURNING *
    `;
    const values = [orderItemId, ...Object.values(updateData)];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async delete(orderItemId) {
    const query = 'DELETE FROM "orderitems" WHERE order_item_id = $1 RETURNING *';
    const { rows } = await pool.query(query, [orderItemId]);
    return rows.length > 0;
  }

  static async findByOrderId(orderId) {
    const query = 'SELECT * FROM "orderitems" WHERE order_id = $1';
    const { rows } = await pool.query(query, [orderId]);
    return rows;
  }
}

module.exports = { Order, OrderItem }; 