const pool = require('../../../common/src/config/database');

class Shop {
  static async create(shopData, client) {
    const query = `
      INSERT INTO shops (
        user_id, name, description, contact_email, contact_phone,
        address, city, country, postal_code, business_registration,
        status, is_verified, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const values = [
      shopData.user_id,
      shopData.name,
      shopData.description,
      shopData.contact_email,
      shopData.contact_phone,
      shopData.address,
      shopData.city,
      shopData.country,
      shopData.postal_code,
      shopData.business_registration,
      shopData.status || 'active',
      shopData.is_verified || false
    ];
    const { rows } = await client.query(query, values);
    return rows[0];
  }

  static async findById(shopId) {
    const query = `
      SELECT * FROM shops WHERE shop_id = $1
    `;
    const { rows } = await pool.query(query, [shopId]);
    return rows[0] || null;
  }

  static async findAll(filters = {}, pagination = {}) {
    let query = 'SELECT * FROM shops';
    const values = [];
    const conditions = [];
    if (filters.user_id) {
      values.push(filters.user_id);
      conditions.push(`user_id = $${values.length}`);
    }
    if (filters.status) {
      values.push(filters.status);
      conditions.push(`status = $${values.length}`);
    }
    if (filters.is_verified !== undefined) {
      values.push(filters.is_verified);
      conditions.push(`is_verified = $${values.length}`);
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

  static async update(shopId, updateData) {
    const setClause = Object.keys(updateData)
      .map((key, idx) => `${key} = $${idx + 2}`)
      .join(', ');
    const query = `
      UPDATE shops
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE shop_id = $1
      RETURNING *
    `;
    const values = [shopId, ...Object.values(updateData)];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async delete(shopId) {
    const query = 'DELETE FROM shops WHERE shop_id = $1 RETURNING *';
    const { rows } = await pool.query(query, [shopId]);
    return rows.length > 0;
  }

  static async updateStatus(shopId, status) {
    const query = `
      UPDATE shops
      SET status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE shop_id = $1
      RETURNING *
    `;
    const { rows } = await pool.query(query, [shopId, status]);
    return rows[0];
  }
}

module.exports = Shop; 