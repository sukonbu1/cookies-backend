const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipe.controller');

router.post('/', recipeController.createRecipe);
router.get('/user/:userId', recipeController.getRecipesByUserId);
router.get('/post/:postId', recipeController.getRecipeByPostId);
router.get('/:id', recipeController.getRecipeById);
router.put('/:id', recipeController.updateRecipe);
router.delete('/:id', recipeController.deleteRecipe);

module.exports = router; 