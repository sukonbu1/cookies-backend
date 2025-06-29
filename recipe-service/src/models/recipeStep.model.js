const pool = require('../../../common/src/config/database');
const { v4: uuidv4 } = require('uuid');

class RecipeStep {
  static async create(stepData, client = pool) {
    const query = `
      INSERT INTO "recipesteps" (
        step_id, recipe_id, step_number, description, media_url, duration, tip, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const values = [
      uuidv4(),
      stepData.recipe_id,
      stepData.step_number,
      stepData.description,
      stepData.media_url || null,
      stepData.duration || null,
      stepData.tip || null
    ];
    const { rows } = await client.query(query, values);
    return rows[0];
  }

  static async findByRecipeId(recipeId) {
    const query = 'SELECT * FROM "recipesteps" WHERE recipe_id = $1 ORDER BY step_number ASC, created_at ASC';
    const { rows } = await pool.query(query, [recipeId]);
    return rows;
  }

  static async update(stepId, updateData) {
    const setClause = Object.keys(updateData)
      .map((key, idx) => `${key} = $${idx + 2}`)
      .join(', ');
    const query = `
      UPDATE "recipesteps"
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE step_id = $1
      RETURNING *
    `;
    const values = [stepId, ...Object.values(updateData)];
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  static async delete(stepId) {
    const query = 'DELETE FROM "recipesteps" WHERE step_id = $1';
    const { rowCount } = await pool.query(query, [stepId]);
    return rowCount > 0;
  }
}

module.exports = RecipeStep; 