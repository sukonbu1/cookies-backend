-- Migration script to make username field nullable
-- Run this on your user_service_db database

-- First, check if there are any existing users with NULL usernames
-- If there are, we need to generate usernames for them first

-- Generate usernames for existing users that don't have one
UPDATE users 
SET username = CONCAT(SPLIT_PART(email, '@', 1), FLOOR(RANDOM() * 1000)::INTEGER)
WHERE username IS NULL OR username = '';

-- Now make the username field nullable
ALTER TABLE users ALTER COLUMN username DROP NOT NULL;

-- Add a unique constraint on username to prevent duplicates
-- (only for non-null values)
CREATE UNIQUE INDEX idx_users_username_unique ON users (username) WHERE username IS NOT NULL;

-- Add an index for faster lookups by username
CREATE INDEX idx_users_username ON users (username);

-- Add an index for faster lookups by email
CREATE INDEX idx_users_email ON users (email); 