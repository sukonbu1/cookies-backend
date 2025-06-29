const pool = require('../../../common/src/config/database');
const { v4: uuidv4 } = require('uuid');

class RecipeIngredient {
  static async create(ingredientData, client = pool) {
    const query = `
      INSERT INTO "recipeingredients" (
        ingredient_id, recipe_id, name, quantity, unit, note, is_optional, position, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const values = [
      uuidv4(),
      ingredientData.recipe_id,
      ingredientData.name,
      ingredientData.quantity || null,
      ingredientData.unit || null,
      ingredientData.note || null,
      ingredientData.is_optional || false,
      ingredientData.position || 0
    ];
    const { rows } = await client.query(query, values);
    return rows[0];
  }

  static async findByRecipeId(recipeId) {
    const query = 'SELECT * FROM "recipeingredients" WHERE recipe_id = $1 ORDER BY position ASC, created_at ASC';
    const { rows } = await pool.query(query, [recipeId]);
    return rows;
  }

  static async update(ingredientId, updateData) {
    const setClause = Object.keys(updateData)
      .map((key, idx) => `${key} = $${idx + 2}`)
      .join(', ');
    const query = `
      UPDATE "recipeingredients"
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE ingredient_id = $1
      RETURNING *
    `;
    const values = [ingredientId, ...Object.values(updateData)];
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  static async delete(ingredientId) {
    const query = 'DELETE FROM "recipeingredients" WHERE ingredient_id = $1';
    const { rowCount } = await pool.query(query, [ingredientId]);
    return rowCount > 0;
  }
}

module.exports = RecipeIngredient; 