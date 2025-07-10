# Get All Recipes by User ID Endpoint

## Overview
This endpoint retrieves all recipes created by a specific user with pagination support.

## Endpoint
```
GET /api/recipes/user/:userId
```

## Parameters

### Path Parameters
- `userId` (string, required): The ID of the user whose recipes you want to retrieve

### Query Parameters
- `limit` (number, optional): Number of recipes to return per page (default: 10, max: 100)
- `offset` (number, optional): Number of recipes to skip for pagination (default: 0)

## Response Format

### Success Response (200)
```json
{
  "status": "success",
  "data": {
    "recipes": [
      {
        "recipe_id": "uuid",
        "post_id": "uuid",
        "user_id": "user-uuid",
        "name": "Recipe Name",
        "cover_media_url": "https://example.com/image.jpg",
        "cuisine_type": "Italian",
        "meal_type": "Dinner",
        "preparation_time": 30,
        "cooking_time": 45,
        "total_time": 75,
        "is_premium": false,
        "premium_price": null,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "ingredients": [
          {
            "ingredient_id": "uuid",
            "recipe_id": "uuid",
            "name": "Ingredient Name",
            "quantity": "2 cups",
            "unit": "cups",
            "notes": "Optional notes"
          }
        ],
        "steps": [
          {
            "step_id": "uuid",
            "recipe_id": "uuid",
            "step_number": 1,
            "description": "Step description",
            "media_url": "https://example.com/step-image.jpg",
            "time_minutes": 10
          }
        ]
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "status": "error",
  "message": "Limit must be between 1 and 100"
}
```

#### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Database connection error"
}
```

## Examples

### Get first 10 recipes for a user
```bash
GET /api/recipes/user/123e4567-e89b-12d3-a456-426614174000
```

### Get 5 recipes starting from the 10th recipe
```bash
GET /api/recipes/user/123e4567-e89b-12d3-a456-426614174000?limit=5&offset=10
```

### Get all recipes for a user (up to 100)
```bash
GET /api/recipes/user/123e4567-e89b-12d3-a456-426614174000?limit=100
```

## Database Schema Changes

This endpoint requires the `recipes` table to have a `user_id` column. Run the migration script `migration-add-user-id.sql` to add this column:

```sql
-- Add user_id column to recipes table
ALTER TABLE "recipes" ADD COLUMN user_id TEXT;

-- Create index on user_id for better query performance
CREATE INDEX idx_recipes_user_id ON "recipes" (user_id);
```

## Notes
- The endpoint queries the `recipes` table directly using the `user_id` field
- Recipes are ordered by creation date (newest first)
- Each recipe includes its ingredients and steps
- The response includes pagination information to help with frontend pagination
- The endpoint validates pagination parameters and returns appropriate error messages
- The `user_id` field should be populated when creating new recipes 