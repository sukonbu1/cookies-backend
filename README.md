# Food Social Network Backend

A microservices-based backend for a food social network platform.

## Services

- **User Service**: User profiles, authentication sync
- **Post Service**: Post metadata, text content, media URLs
- **Recipe Service**: Recipe data (linked to posts)
- **Product Service**: Product catalog, variants, images (URLs only)
- **Shop Service**: Orders, shops
- **Follow Service**: User relationships
- **Tag Service**: Tags and categorization
- **Notification Service**: Notifications

## Tech Stack

- Node.js/JavaScript
- PostgreSQL 
- Redis (for caching)
- Kong (API Gateway)

## Prerequisites

- Docker and Docker Compose
- Node.js (v18 or higher)
- npm or yarn

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` in each service directory and configure the environment variables
3. Run `docker-compose up -d` to start the infrastructure services
4. Install dependencies for each service:
   ```bash
   cd <service-name>
   npm install
   ```
5. Start each service:
   ```bash
   npm run dev
   ```

## Development

Each service is independently deployable and follows the same basic structure:

```
service-name/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
├── tests/
├── .env.example
├── package.json
└── README.md
```

## Media Uploads

- **All media uploads (images, videos) are now handled by the frontend.**
- The backend only stores and processes media URLs provided by the frontend (e.g., Cloudinary URLs).
- No backend file upload or Cloudinary integration is present in any service.

## API Documentation

API documentation is available at `/api-docs` when running the services locally.
