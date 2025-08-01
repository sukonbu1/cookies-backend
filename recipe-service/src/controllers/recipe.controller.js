const Recipe = require('../models/recipe.model');
const RecipeIngredient = require('../models/recipeIngredient.model');
const RecipeStep = require('../models/recipeStep.model');

class RecipeController {
  async createRecipe(req, res, next) {
    const { ingredients, steps, ...recipeData } = req.body;
    const userId = req.user.uid || req.user.user_id; // Get user_id from authenticated user
    const client = await require('../../../common/src/config/database').connect();
    try {
      await client.query('BEGIN');
      // Create recipe with user_id from authenticated user
      const recipe = await Recipe.create({
        ...recipeData,
        user_id: userId // Ensure user_id is set from authenticated user
      }, client);
      // Create ingredients
      const ingredientRecords = [];
      if (Array.isArray(ingredients)) {
        for (const ing of ingredients) {
          const record = await RecipeIngredient.create({ ...ing, recipe_id: recipe.recipe_id }, client);
          ingredientRecords.push(record);
        }
      }
      // Create steps
      const stepRecords = [];
      if (Array.isArray(steps)) {
        for (const step of steps) {
          const record = await RecipeStep.create({ ...step, recipe_id: recipe.recipe_id }, client);
          stepRecords.push(record);
        }
      }
      await client.query('COMMIT');
      res.status(201).json({ status: 'success', data: { ...recipe, ingredients: ingredientRecords, steps: stepRecords } });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }

  async getRecipeById(req, res, next) {
    try {
      const recipe = await Recipe.findById(req.params.id);
      if (!recipe) return res.status(404).json({ status: 'error', message: 'Recipe not found' });
      const ingredients = await RecipeIngredient.findByRecipeId(recipe.recipe_id);
      const steps = await RecipeStep.findByRecipeId(recipe.recipe_id);
      res.json({ status: 'success', data: { ...recipe, ingredients, steps } });
    } catch (error) {
      next(error);
    }
  }

  async getRecipeByPostId(req, res, next) {
    try {
      const recipe = await Recipe.findByPostId(req.params.postId);
      if (!recipe) return res.status(404).json({ status: 'error', message: 'Recipe not found' });
      const ingredients = await RecipeIngredient.findByRecipeId(recipe.recipe_id);
      const steps = await RecipeStep.findByRecipeId(recipe.recipe_id);
      res.json({ status: 'success', data: { ...recipe, ingredients, steps } });
    } catch (error) {
      next(error);
    }
  }

  async updateRecipe(req, res, next) {
    try {
      const { ingredients, steps, ...updateData } = req.body;
      const recipe = await Recipe.update(req.params.id, updateData);
      if (!recipe) return res.status(404).json({ status: 'error', message: 'Recipe not found' });
      // Optionally update ingredients and steps (not implemented here for brevity)
      res.json({ status: 'success', data: recipe });
    } catch (error) {
      next(error);
    }
  }

  async deleteRecipe(req, res, next) {
    try {
      const deleted = await Recipe.delete(req.params.id);
      if (!deleted) return res.status(404).json({ status: 'error', message: 'Recipe not found' });
      res.json({ status: 'success', message: 'Recipe deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getRecipesByUserId(req, res, next) {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;
      
      // Validate pagination parameters
      if (limit < 1 || limit > 100) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Limit must be between 1 and 100' 
        });
      }
      
      if (offset < 0) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Offset must be non-negative' 
        });
      }

      const recipes = await Recipe.findByUserId(userId, limit, offset);
      const totalCount = await Recipe.countByUserId(userId);
      
      // Get ingredients and steps for each recipe
      const recipesWithDetails = await Promise.all(
        recipes.map(async (recipe) => {
          const ingredients = await RecipeIngredient.findByRecipeId(recipe.recipe_id);
          const steps = await RecipeStep.findByRecipeId(recipe.recipe_id);
          return {
            ...recipe,
            ingredients,
            steps
          };
        })
      );

      res.json({
        status: 'success',
        data: {
          recipes: recipesWithDetails,
          pagination: {
            total: totalCount,
            limit,
            offset,
            hasMore: offset + limit < totalCount
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RecipeController(); 