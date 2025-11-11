-- Migration: Update api_keys.key_hash to support bcrypt hashes
-- Changed from: varchar(64) for SHA-256 hashes
-- Changed to: text for bcrypt hashes (60 characters)
-- Reason: Aligning with ai-server authentication system

ALTER TABLE "api_keys" ALTER COLUMN "key_hash" TYPE text;
