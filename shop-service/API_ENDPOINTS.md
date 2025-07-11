# Shop Service API Endpoints

## Orders

### Get Orders by Shop
**GET** `/api/orders/shop/:shopId`

Get all orders for a specific shop with optional filtering and pagination.

**Parameters:**
- `shopId` (path): UUID of the shop
- `page` (query, optional): Page number (default: 1)
- `limit` (query, optional): Number of orders per page (default: 10)
- `order_status` (query, optional): Filter by order status
- `payment_status` (query, optional): Filter by payment status
- `shipping_status` (query, optional): Filter by shipping status

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "order_id": "uuid",
      "user_id": "user-uuid",
      "shop_id": "shop-uuid",
      "order_number": "ORD-1234567890-1234",
      "total_amount": 99.99,
      "subtotal": 89.99,
      "tax_amount": 10.00,
      "shipping_amount": 0.00,
      "discount_amount": 0.00,
      "currency": "USD",
      "payment_method": "credit_card",
      "payment_status": "paid",
      "shipping_method": "standard",
      "shipping_status": "shipped",
      "order_status": "completed",
      "tracking_number": "TRK123456789",
      "notes": "Customer requested express delivery",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Order
**POST** `/api/orders`

Create a new order. The `shop_id` is now required in the request body.

**Request Body:**
```json
{
  "shop_id": "shop-uuid",
  "total_amount": 99.99,
  "subtotal": 89.99,
  "tax_amount": 10.00,
  "shipping_amount": 0.00,
  "discount_amount": 0.00,
  "currency": "USD",
  "payment_method": "credit_card",
  "payment_status": "pending",
  "shipping_method": "standard",
  "shipping_status": "pending",
  "order_status": "pending",
  "tracking_number": null,
  "notes": "Customer requested express delivery"
}
```

## Products

### Get Products by Shop
**GET** `/api/products/shop/:shopId`

Get all products for a specific shop with optional filtering and pagination.

**Parameters:**
- `shopId` (path): UUID of the shop
- `page` (query, optional): Page number (default: 1)
- `limit` (query, optional): Number of products per page (default: 10)
- `category_id` (query, optional): Filter by category ID
- `status` (query, optional): Filter by product status
- `min_price` (query, optional): Minimum price filter
- `max_price` (query, optional): Maximum price filter
- `search` (query, optional): Search term for product name/description

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "product_id": "uuid",
      "shop_id": "shop-uuid",
      "name": "Product Name",
      "description": "Product description",
      "price": 29.99,
      "category_id": "category-uuid",
      "status": "active",
      "images": ["image1.jpg", "image2.jpg"],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Get Product by ID
**GET** `/api/products/:productId`

Get a specific product by its ID.

**Parameters:**
- `productId` (path): UUID of the product

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "product_id": "uuid",
    "shop_id": "shop-uuid",
    "name": "Product Name",
    "description": "Product description",
    "price": 29.99,
    "category_id": "category-uuid",
    "status": "active",
    "images": ["image1.jpg", "image2.jpg"],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

## Database Migration

To add the `shop_id` column to the orders table, run:

```bash
node migrate-add-shop-id.js
```

This will:
1. Check if the `shop_id` column already exists
2. Add the column if it doesn't exist
3. Create an index for better performance
4. Reference the `shops(shop_id)` table for data integrity 