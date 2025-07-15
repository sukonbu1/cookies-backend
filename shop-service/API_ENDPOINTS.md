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
Authorization: Bearer <token>

**Response:**
{
  "status": "success",
  "data": [ ... ]
}

### Create Order
**POST** `/api/orders`

Create a new order. The `shop_id` is now required in the request body.

**Request Body:**
{
  "shop_id": "shop-uuid",
  ...
}

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
Authorization: Bearer <token>

**Response:**
{
  "status": "success",
  "data": [ ... ]
}

### Get Product by ID
**GET** `/api/products/:productId`

Get a specific product by its ID.

**Parameters:**
- `productId` (path): UUID of the product

**Headers:**
Authorization: Bearer <token>

**Response:**
{
  "status": "success",
  "data": { ... }
}

## Database Migration

To add the `shop_id`