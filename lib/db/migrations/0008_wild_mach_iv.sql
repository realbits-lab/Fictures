CREATE TABLE IF NOT EXISTS "PermittedUser" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(64) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "PermittedUser_email_unique" UNIQUE("email")
);
