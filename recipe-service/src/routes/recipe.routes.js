const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipe.controller');

// Create a recipe (with ingredients and steps)
router.post('/', recipeController.createRecipe);
// Get a recipe by recipe_id
router.get('/:id', recipeController.getRecipeById);
// Get a recipe by post_id
router.get('/post/:postId', recipeController.getRecipeByPostId);
// Update a recipe
router.put('/:id', recipeController.updateRecipe);
// Delete a recipe
router.delete('/:id', recipeController.deleteRecipe);

module.exports = router; 