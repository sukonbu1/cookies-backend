const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipe.controller');
const { authenticate } = require('../../../common/src/middleware/auth.middleware');

router.post('/', authenticate, recipeController.createRecipe);
router.get('/user/:userId', recipeController.getRecipesByUserId);
router.get('/post/:postId', recipeController.getRecipeByPostId);
router.get('/:id', recipeController.getRecipeById);
router.put('/:id', authenticate, recipeController.updateRecipe);
router.delete('/:id', authenticate, recipeController.deleteRecipe);

module.exports = router; 