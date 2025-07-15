const pool = require('../../../common/src/config/database');
const { v4: uuidv4 } = require('uuid');

class OrderItem {
  static async create(itemData, client = pool) {
    const query = `
      INSERT INTO "orderitems" (
        order_item_id, order_id, product_id, shop_id, quantity, 
        unit_price, total_price, discount_amount, tax_amount, status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const values = [
      uuidv4(),
      itemData.order_id,
      itemData.product_id,
      itemData.shop_id,
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

  static async findByOrderId(orderId) {
    const query = 'SELECT * FROM "orderitems" WHERE order_id = $1';
    const { rows } = await pool.query(query, [orderId]);
    return rows;
  }

  static async findDetailedByOrderId(orderId) {
    const query = `
      SELECT oi.order_item_id, oi.product_id, p.name as product_name, oi.quantity, oi.variant_id,
             v.sku, v.price, v.sale_price, v.color, v.size, v.material, oi.shop_id
      FROM "orderitems" oi
      LEFT JOIN "products" p ON oi.product_id = p.product_id
      LEFT JOIN "productvariants" v ON oi.variant_id = v.variant_id
      WHERE oi.order_id = $1
    `;
    const { rows } = await pool.query(query, [orderId]);
    return rows;
  }
}

module.exports = OrderItem; 