-- Custom SQL migration file, put your code below! --

-- Add missing emailVerified column for NextAuth.js
ALTER TABLE "users" ADD COLUMN "emailVerified" timestamp;

-- Add missing camelCase columns that NextAuth.js expects
ALTER TABLE "users" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "users" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;

-- Copy data from snake_case to camelCase columns
UPDATE "users" SET "createdAt" = "created_at", "updatedAt" = "updated_at";