-- Custom SQL migration file, put your code below! --

-- Create user_preferences table for storing user settings including theme preferences
CREATE TABLE IF NOT EXISTS "user_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"theme" varchar(20) DEFAULT 'system',
	"language" varchar(10) DEFAULT 'en',
	"timezone" varchar(50) DEFAULT 'UTC',
	"emailNotifications" boolean DEFAULT true,
	"pushNotifications" boolean DEFAULT false,
	"marketingEmails" boolean DEFAULT false,
	"profileVisibility" varchar(20) DEFAULT 'public',
	"showEmail" boolean DEFAULT false,
	"showStats" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;