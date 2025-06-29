require('dotenv').config();
const express = require('express');
const app = express();
const recipeRoutes = require('./routes/recipe.routes');

app.use(express.json());

app.use('/api/recipes', recipeRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: err.message });
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Recipe service running on port ${PORT}`);
}); 