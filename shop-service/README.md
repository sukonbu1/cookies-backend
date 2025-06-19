# Shop Service

This is the **Shop Service** for the platform. It manages shop creation, updates, deletion, and retrieval, as well as shop status and verification. It also handles Orders and Payments. It is built as a Node.js microservice using Express and PostgreSQL.

## Features
- Shop Management:
  - Create, update, delete, and retrieve shops
  - Pagination and filtering for shop listings
  - Shop status management (active, inactive, suspended)

- Order Management:
  - Create, update, delete, and retrieve orders
  - Order status management

- Payment Management:
  - Create, update, delete, and retrieve payments

## Technologies Used
- Node.js
- Express.js
- PostgreSQL (NeonDB compatible)
- Redis (for caching)
- RabbitMQ (for async messaging)
- JWT (for authentication)
- express-validator
- dotenv
- helmet, morgan, cors

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env` and fill in the required values (Database, Redis, JWT, RabbitMQ, etc.)

   Example `.env`:
   ```env
   DATABASE_URL=postgresql://<username>:<password>@<neon_host>/<database>?sslmode=require
   JWT_SECRET=your_production_jwt_secret
   REDIS_URL=redis://localhost:6379
   RABBITMQ_URL=amqp://<rabbitmq_user>:<rabbitmq_password>@<rabbitmq_host>:5672
   USER_SERVICE_URL=https://your-user-service-domain/api/users
   CORS_ORIGIN=https://your-frontend-domain
   NODE_ENV=production
   PORT=3002
   ```

3. **Run the service:**
   ```bash
   npm run dev
   ```
   or
   ```bash
   npm start
   ```

## API Endpoints

### Shop Endpoints
- `GET /api/shops` - List all shops (with pagination and filters)
- `GET /api/shops/:id` - Get shop by ID
- `POST /api/shops` - Create a new shop (auth required)
- `PUT /api/shops/:id` - Update a shop (auth required)
- `DELETE /api/shops/:id` - Delete a shop (auth required)
- `PATCH /api/shops/:id/status` - Update shop status (auth required)

### Order Endpoints
- `GET /api/orders` - List all orders (auth required)
- `GET /api/orders/:id` - Get order by ID (auth required)
- `POST /api/orders` - Create a new order (auth required)
- `PUT /api/orders/:id` - Update an order (auth required)
- `DELETE /api/orders/:id` - Delete an order (auth required)

### Payment Endpoints
- `GET /api/payments` - List all payments (auth required)
- `GET /api/payments/:id` - Get payment by ID (auth required)
- `POST /api/payments` - Create a new payment (auth required)
- `PUT /api/payments/:id` - Update a payment (auth required)
- `DELETE /api/payments/:id` - Delete a payment (auth required)

## Authentication
- All POST, PUT, PATCH, and DELETE endpoints require a valid JWT token (sent as a cookie or Bearer token).
- Use the `/api/shops`, `/api/orders`, and `/api/payments` endpoints with authentication for all sensitive actions.

## Folder Structure

- `src/`
  - `controllers/` - Route handlers
  - `models/` - Database access logic
  - `routes/` - Express route definitions
  - `middleware/` - Error handling, validation, etc.
  - `services/` - Business logic
  - `utils/` - Utility functions
  - `config/` - Configuration files

## Deployment Notes
- Use NeonDB for production PostgreSQL (ensure `sslmode=require` in your connection string).
- Use Docker or native install for RabbitMQ on your VPS. Set `RABBITMQ_URL` accordingly.
- Use a process manager like `pm2` or `systemd` to keep the service running.
- Open required ports (3002 for API, 5672 for RabbitMQ, 15672 for RabbitMQ UI if needed).
- Never commit your `.env` file to git.

## Quick Deployment Checklist
- [ ] Push code to VPS
- [ ] Install dependencies: `npm install`
- [ ] Set up `.env` with NeonDB, RabbitMQ, JWT, etc.
- [ ] Start RabbitMQ (Docker or native)
- [ ] Start Redis (if used)
- [ ] Start the service: `npm start` or with `pm2`
- [ ] Test endpoints and logs

## License
ISC 