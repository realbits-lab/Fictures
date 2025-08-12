CREATE TABLE IF NOT EXISTS "Bookmark" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"storyId" uuid NOT NULL,
	"chapterNumber" integer NOT NULL,
	"position" numeric DEFAULT '0' NOT NULL,
	"note" text,
	"isAutomatic" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Chapter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storyId" uuid NOT NULL,
	"chapterNumber" integer NOT NULL,
	"title" text NOT NULL,
	"content" json NOT NULL,
	"wordCount" integer DEFAULT 0 NOT NULL,
	"isPublished" boolean DEFAULT false NOT NULL,
	"publishedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"authorNote" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Character" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storyId" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"personalityTraits" json,
	"appearance" text,
	"role" varchar DEFAULT 'supporting' NOT NULL,
	"imageUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "OfflineStory" (
	"userId" uuid NOT NULL,
	"storyId" uuid NOT NULL,
	"downloadedChapters" json DEFAULT '[]'::json NOT NULL,
	"totalSize" integer DEFAULT 0 NOT NULL,
	"downloadedAt" timestamp DEFAULT now() NOT NULL,
	"lastSyncAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "OfflineStory_userId_storyId_pk" PRIMARY KEY("userId","storyId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ReadingAchievement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"achievementType" varchar NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"target" integer DEFAULT 1 NOT NULL,
	"isUnlocked" boolean DEFAULT false NOT NULL,
	"unlockedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ReadingCollection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"privacy" varchar DEFAULT 'private' NOT NULL,
	"storyIds" json DEFAULT '[]'::json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ReadingList" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"storyIds" json DEFAULT '[]'::json NOT NULL,
	"storyOrder" json DEFAULT '[]'::json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ReadingProgress" (
	"userId" uuid NOT NULL,
	"storyId" uuid NOT NULL,
	"currentChapterNumber" integer DEFAULT 1 NOT NULL,
	"currentPosition" numeric DEFAULT '0' NOT NULL,
	"lastReadAt" timestamp DEFAULT now() NOT NULL,
	"totalTimeRead" integer DEFAULT 0 NOT NULL,
	"isCompleted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "ReadingProgress_userId_storyId_pk" PRIMARY KEY("userId","storyId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ReadingStatistics" (
	"userId" uuid PRIMARY KEY NOT NULL,
	"totalReadingTimeMinutes" integer DEFAULT 0 NOT NULL,
	"dailyReadingTimeMinutes" integer DEFAULT 0 NOT NULL,
	"weeklyReadingTimeMinutes" integer DEFAULT 0 NOT NULL,
	"currentStreak" integer DEFAULT 0 NOT NULL,
	"longestStreak" integer DEFAULT 0 NOT NULL,
	"storiesCompleted" integer DEFAULT 0 NOT NULL,
	"chaptersRead" integer DEFAULT 0 NOT NULL,
	"wordsRead" integer DEFAULT 0 NOT NULL,
	"averageWordsPerMinute" integer DEFAULT 200 NOT NULL,
	"favoriteGenres" json DEFAULT '[]'::json NOT NULL,
	"lastReadingDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Story" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"genre" varchar(50),
	"status" varchar DEFAULT 'draft' NOT NULL,
	"authorId" uuid NOT NULL,
	"isPublished" boolean DEFAULT false NOT NULL,
	"publishedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"wordCount" integer DEFAULT 0 NOT NULL,
	"chapterCount" integer DEFAULT 0 NOT NULL,
	"readCount" integer DEFAULT 0 NOT NULL,
	"likeCount" integer DEFAULT 0 NOT NULL,
	"coverImageUrl" text,
	"tags" json DEFAULT '[]'::json NOT NULL,
	"mature" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "StoryInteraction" (
	"userId" uuid NOT NULL,
	"storyId" uuid NOT NULL,
	"interactionType" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "StoryInteraction_userId_storyId_interactionType_pk" PRIMARY KEY("userId","storyId","interactionType")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "StoryTag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" varchar(7) DEFAULT '#000000',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "StoryTag_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserPreferences" (
	"userId" uuid PRIMARY KEY NOT NULL,
	"readingTheme" varchar DEFAULT 'light' NOT NULL,
	"fontFamily" varchar DEFAULT 'serif' NOT NULL,
	"fontSize" integer DEFAULT 16 NOT NULL,
	"lineHeight" numeric DEFAULT '1.5' NOT NULL,
	"letterSpacing" numeric DEFAULT '0' NOT NULL,
	"wordSpacing" numeric DEFAULT '0' NOT NULL,
	"contentWidth" integer DEFAULT 800 NOT NULL,
	"marginSize" integer DEFAULT 40 NOT NULL,
	"paragraphSpacing" numeric DEFAULT '1.2' NOT NULL,
	"layoutStyle" varchar DEFAULT 'single-column' NOT NULL,
	"highContrast" boolean DEFAULT false NOT NULL,
	"colorContrast" numeric DEFAULT '1.0' NOT NULL,
	"dyslexiaFriendly" boolean DEFAULT false NOT NULL,
	"highlightSyllables" boolean DEFAULT false NOT NULL,
	"readingRuler" boolean DEFAULT false NOT NULL,
	"reduceMotion" boolean DEFAULT false NOT NULL,
	"screenReaderMode" boolean DEFAULT false NOT NULL,
	"autoBookmarking" boolean DEFAULT true NOT NULL,
	"offlineReading" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_storyId_Story_id_fk" FOREIGN KEY ("storyId") REFERENCES "public"."Story"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_storyId_Story_id_fk" FOREIGN KEY ("storyId") REFERENCES "public"."Story"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Character" ADD CONSTRAINT "Character_storyId_Story_id_fk" FOREIGN KEY ("storyId") REFERENCES "public"."Story"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "OfflineStory" ADD CONSTRAINT "OfflineStory_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "OfflineStory" ADD CONSTRAINT "OfflineStory_storyId_Story_id_fk" FOREIGN KEY ("storyId") REFERENCES "public"."Story"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReadingAchievement" ADD CONSTRAINT "ReadingAchievement_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReadingCollection" ADD CONSTRAINT "ReadingCollection_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReadingList" ADD CONSTRAINT "ReadingList_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_storyId_Story_id_fk" FOREIGN KEY ("storyId") REFERENCES "public"."Story"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReadingStatistics" ADD CONSTRAINT "ReadingStatistics_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Story" ADD CONSTRAINT "Story_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "StoryInteraction" ADD CONSTRAINT "StoryInteraction_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "StoryInteraction" ADD CONSTRAINT "StoryInteraction_storyId_Story_id_fk" FOREIGN KEY ("storyId") REFERENCES "public"."Story"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
