-- Add role column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'reader';

-- Create test users for Playwright testing
INSERT INTO users (id, email, name, role, bio, created_at, updated_at) VALUES 
  ('test-reader-1', 'reader@test.com', 'Test Reader', 'reader', 'Test user with reader role for automated testing', NOW(), NOW()),
  ('test-writer-1', 'writer@test.com', 'Test Writer', 'writer', 'Test user with writer role for automated testing', NOW(), NOW()),
  ('test-manager-1', 'manager@test.com', 'Test Manager', 'manager', 'Test user with manager role for automated testing', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET 
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  bio = EXCLUDED.bio,
  updated_at = NOW();