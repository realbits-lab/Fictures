-- Custom SQL migration file, put your code below! --

-- Add missing emailVerified column to users table for NextAuth.js compatibility
ALTER TABLE "users" ADD COLUMN "emailVerified" timestamp;

-- Add missing NextAuth.js specific columns that may be needed
ALTER TABLE "users" ADD COLUMN "username" varchar(50) UNIQUE;
ALTER TABLE "users" ADD COLUMN "password" varchar(255);
ALTER TABLE "users" ADD COLUMN "bio" text;
ALTER TABLE "users" ADD COLUMN "role" varchar(20) DEFAULT 'reader' NOT NULL;
ALTER TABLE "users" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "users" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;