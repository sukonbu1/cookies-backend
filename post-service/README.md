# Post Service

This is the Post microservice for the Food Social Network project.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a PostgreSQL database named `post_service_db` and run the schema for the `posts` table.
3. Configure your `.env` file (see `.env` for example).
4. Start the service:
   ```bash
   npm run dev
   ```

## Endpoints

- `POST /api/posts` - Create a new post (media URLs only; upload handled by frontend)
- `GET /api/posts/:postId` - Get a post by ID
- `GET /api/posts/user/:userId` - Get posts by user
- `GET /health` - Health check

## Media Handling

- All media uploads (images, videos) are handled by the frontend (e.g., direct to Cloudinary).
- The backend only stores and processes media URLs provided by the frontend.
- No backend file upload or Cloudinary integration is present.

## Caching

This service uses Redis to cache post data for faster access. 