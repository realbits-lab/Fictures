-- Drop unused NextAuth.js tables
-- These tables are not used because we use JWT sessions and no database adapter

DROP TABLE IF EXISTS "accounts" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "verification_tokens" CASCADE;
