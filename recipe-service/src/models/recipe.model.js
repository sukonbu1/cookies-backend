const pool = require('../../../common/src/config/database');
const { v4: uuidv4 } = require('uuid');

class Recipe {
  static async create(recipeData, client = pool) {
    const query = `
      INSERT INTO "recipes" (
        recipe_id, post_id, name, cover_media_url, cuisine_type, meal_type, preparation_time, cooking_time, total_time, is_premium, premium_price, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const values = [
      uuidv4(),
      recipeData.post_id,
      recipeData.name,
      recipeData.cover_media_url || null,
      recipeData.cuisine_type || null,
      recipeData.meal_type || null,
      recipeData.preparation_time || null,
      recipeData.cooking_time || null,
      recipeData.total_time || null,
      recipeData.is_premium || false,
      recipeData.premium_price || null
    ];
    const { rows } = await client.query(query, values);
    return rows[0];
  }

  static async findById(recipeId) {
    const query = 'SELECT * FROM "recipes" WHERE recipe_id = $1';
    const { rows } = await pool.query(query, [recipeId]);
    return rows[0] || null;
  }

  static async findByPostId(postId) {
    const query = 'SELECT * FROM "recipes" WHERE post_id = $1';
    const { rows } = await pool.query(query, [postId]);
    return rows[0] || null;
  }

  static async update(recipeId, updateData) {
    const setClause = Object.keys(updateData)
      .map((key, idx) => `${key} = $${idx + 2}`)
      .join(', ');
    const query = `
      UPDATE "recipes"
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE recipe_id = $1
      RETURNING *
    `;
    const values = [recipeId, ...Object.values(updateData)];
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  static async delete(recipeId) {
    const query = 'DELETE FROM "recipes" WHERE recipe_id = $1';
    const { rowCount } = await pool.query(query, [recipeId]);
    return rowCount > 0;
  }
}

module.exports = Recipe; 
