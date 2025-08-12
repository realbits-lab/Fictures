CREATE TABLE IF NOT EXISTS "Achievement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"type" varchar NOT NULL,
	"category" text NOT NULL,
	"iconUrl" text,
	"badgeUrl" text,
	"rarity" varchar NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"criteria" json,
	"isSecret" boolean DEFAULT false NOT NULL,
	"unlockCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "BetaReader" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"specialties" json DEFAULT '[]'::json NOT NULL,
	"experience" varchar NOT NULL,
	"rate" numeric,
	"availability" varchar DEFAULT 'available' NOT NULL,
	"portfolio" json DEFAULT '[]'::json NOT NULL,
	"guidelines" text,
	"rating" numeric DEFAULT '0',
	"reviewCount" integer DEFAULT 0 NOT NULL,
	"turnaroundTime" integer DEFAULT 7 NOT NULL,
	"isVerified" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "BetaReaderRequest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"authorId" uuid NOT NULL,
	"betaReaderId" uuid NOT NULL,
	"storyId" uuid NOT NULL,
	"chapterIds" json DEFAULT '[]'::json NOT NULL,
	"requestType" varchar NOT NULL,
	"deadline" timestamp NOT NULL,
	"budget" numeric,
	"requirements" text,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "CoAuthor" (
	"storyId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" varchar NOT NULL,
	"permissions" json,
	"invitedBy" uuid NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"contributionShare" integer DEFAULT 0 NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "CoAuthor_storyId_userId_pk" PRIMARY KEY("storyId","userId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Contest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"slug" text NOT NULL,
	"organizerId" uuid NOT NULL,
	"type" varchar NOT NULL,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"rules" text NOT NULL,
	"prizes" json,
	"judgingCriteria" json,
	"maxSubmissions" integer,
	"submissionStart" timestamp NOT NULL,
	"submissionEnd" timestamp NOT NULL,
	"votingStart" timestamp,
	"votingEnd" timestamp,
	"judgeIds" json DEFAULT '[]'::json NOT NULL,
	"submissionCount" integer DEFAULT 0 NOT NULL,
	"participantCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Contest_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ContestSubmission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contestId" uuid NOT NULL,
	"authorId" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"storyId" uuid,
	"wordCount" integer DEFAULT 0 NOT NULL,
	"isAnonymous" boolean DEFAULT false NOT NULL,
	"publicVoteCount" integer DEFAULT 0 NOT NULL,
	"judgeScore" numeric,
	"rank" integer,
	"isDisqualified" boolean DEFAULT false NOT NULL,
	"disqualificationReason" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ContestVote" (
	"contestId" uuid NOT NULL,
	"submissionId" uuid NOT NULL,
	"voterId" uuid NOT NULL,
	"score" integer NOT NULL,
	"isJudgeVote" boolean DEFAULT false NOT NULL,
	"feedback" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ContestVote_contestId_submissionId_voterId_pk" PRIMARY KEY("contestId","submissionId","voterId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ForumCategory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"parentId" uuid,
	"order" integer DEFAULT 0 NOT NULL,
	"isVisible" boolean DEFAULT true NOT NULL,
	"moderatorIds" json DEFAULT '[]'::json NOT NULL,
	"postCount" integer DEFAULT 0 NOT NULL,
	"threadCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ForumCategory_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ForumModeration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"targetType" varchar NOT NULL,
	"targetId" uuid NOT NULL,
	"moderatorId" uuid NOT NULL,
	"action" varchar NOT NULL,
	"reason" text NOT NULL,
	"duration" integer,
	"expiresAt" timestamp,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ForumPost" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"threadId" uuid NOT NULL,
	"authorId" uuid NOT NULL,
	"content" text NOT NULL,
	"isEdited" boolean DEFAULT false NOT NULL,
	"editedAt" timestamp,
	"isDeleted" boolean DEFAULT false NOT NULL,
	"parentPostId" uuid,
	"likeCount" integer DEFAULT 0 NOT NULL,
	"reportCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ForumThread" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"categoryId" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"authorId" uuid NOT NULL,
	"isLocked" boolean DEFAULT false NOT NULL,
	"isPinned" boolean DEFAULT false NOT NULL,
	"isSticky" boolean DEFAULT false NOT NULL,
	"tags" json DEFAULT '[]'::json NOT NULL,
	"viewCount" integer DEFAULT 0 NOT NULL,
	"postCount" integer DEFAULT 0 NOT NULL,
	"lastPostAt" timestamp,
	"lastPostAuthorId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ForumThread_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"ownerId" uuid NOT NULL,
	"type" varchar NOT NULL,
	"category" varchar NOT NULL,
	"tags" json DEFAULT '[]'::json NOT NULL,
	"memberLimit" integer,
	"memberCount" integer DEFAULT 0 NOT NULL,
	"avatarUrl" text,
	"bannerUrl" text,
	"rules" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Group_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "GroupActivity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"groupId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"activityType" varchar NOT NULL,
	"content" text NOT NULL,
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "GroupInvitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"groupId" uuid NOT NULL,
	"inviterId" uuid NOT NULL,
	"inviteeId" uuid NOT NULL,
	"message" text,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"respondedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "GroupMember" (
	"groupId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" varchar NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"invitedBy" uuid,
	"isActive" boolean DEFAULT true NOT NULL,
	CONSTRAINT "GroupMember_groupId_userId_pk" PRIMARY KEY("groupId","userId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Leaderboard" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar NOT NULL,
	"category" varchar NOT NULL,
	"userId" uuid NOT NULL,
	"score" integer NOT NULL,
	"rank" integer NOT NULL,
	"period" timestamp NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"type" varchar NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"actionUrl" text,
	"isRead" boolean DEFAULT false NOT NULL,
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ReportContent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporterId" uuid NOT NULL,
	"contentType" varchar NOT NULL,
	"contentId" uuid NOT NULL,
	"reason" varchar NOT NULL,
	"description" text,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"reviewedBy" uuid,
	"reviewedAt" timestamp,
	"resolution" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserAchievement" (
	"userId" uuid NOT NULL,
	"achievementId" uuid NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"maxProgress" integer DEFAULT 1 NOT NULL,
	"isUnlocked" boolean DEFAULT false NOT NULL,
	"unlockedAt" timestamp,
	"isDisplayed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "UserAchievement_userId_achievementId_pk" PRIMARY KEY("userId","achievementId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserFollowing" (
	"followerId" uuid NOT NULL,
	"followingId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "UserFollowing_followerId_followingId_pk" PRIMARY KEY("followerId","followingId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserLevel" (
	"userId" uuid PRIMARY KEY NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"experience" integer DEFAULT 0 NOT NULL,
	"nextLevelExp" integer DEFAULT 100 NOT NULL,
	"totalExp" integer DEFAULT 0 NOT NULL,
	"title" text DEFAULT 'Newcomer' NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Workshop" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"instructorId" uuid NOT NULL,
	"type" varchar NOT NULL,
	"category" varchar NOT NULL,
	"maxParticipants" integer,
	"currentParticipants" integer DEFAULT 0 NOT NULL,
	"price" numeric DEFAULT '0' NOT NULL,
	"duration" integer NOT NULL,
	"scheduledAt" timestamp,
	"status" varchar DEFAULT 'scheduled' NOT NULL,
	"materials" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WorkshopParticipant" (
	"workshopId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"enrolledAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp,
	"progress" integer DEFAULT 0 NOT NULL,
	"rating" integer,
	"feedback" text,
	CONSTRAINT "WorkshopParticipant_workshopId_userId_pk" PRIMARY KEY("workshopId","userId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "BetaReader" ADD CONSTRAINT "BetaReader_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "BetaReaderRequest" ADD CONSTRAINT "BetaReaderRequest_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "BetaReaderRequest" ADD CONSTRAINT "BetaReaderRequest_betaReaderId_BetaReader_id_fk" FOREIGN KEY ("betaReaderId") REFERENCES "public"."BetaReader"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "BetaReaderRequest" ADD CONSTRAINT "BetaReaderRequest_storyId_Story_id_fk" FOREIGN KEY ("storyId") REFERENCES "public"."Story"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CoAuthor" ADD CONSTRAINT "CoAuthor_storyId_Story_id_fk" FOREIGN KEY ("storyId") REFERENCES "public"."Story"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CoAuthor" ADD CONSTRAINT "CoAuthor_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CoAuthor" ADD CONSTRAINT "CoAuthor_invitedBy_User_id_fk" FOREIGN KEY ("invitedBy") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Contest" ADD CONSTRAINT "Contest_organizerId_User_id_fk" FOREIGN KEY ("organizerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ContestSubmission" ADD CONSTRAINT "ContestSubmission_contestId_Contest_id_fk" FOREIGN KEY ("contestId") REFERENCES "public"."Contest"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ContestSubmission" ADD CONSTRAINT "ContestSubmission_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ContestSubmission" ADD CONSTRAINT "ContestSubmission_storyId_Story_id_fk" FOREIGN KEY ("storyId") REFERENCES "public"."Story"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ContestVote" ADD CONSTRAINT "ContestVote_contestId_Contest_id_fk" FOREIGN KEY ("contestId") REFERENCES "public"."Contest"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ContestVote" ADD CONSTRAINT "ContestVote_submissionId_ContestSubmission_id_fk" FOREIGN KEY ("submissionId") REFERENCES "public"."ContestSubmission"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ContestVote" ADD CONSTRAINT "ContestVote_voterId_User_id_fk" FOREIGN KEY ("voterId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ForumCategory" ADD CONSTRAINT "ForumCategory_parentId_ForumCategory_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."ForumCategory"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ForumModeration" ADD CONSTRAINT "ForumModeration_moderatorId_User_id_fk" FOREIGN KEY ("moderatorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_threadId_ForumThread_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."ForumThread"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_parentPostId_ForumPost_id_fk" FOREIGN KEY ("parentPostId") REFERENCES "public"."ForumPost"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_categoryId_ForumCategory_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."ForumCategory"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_lastPostAuthorId_User_id_fk" FOREIGN KEY ("lastPostAuthorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Group" ADD CONSTRAINT "Group_ownerId_User_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "GroupActivity" ADD CONSTRAINT "GroupActivity_groupId_Group_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "GroupActivity" ADD CONSTRAINT "GroupActivity_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "GroupInvitation" ADD CONSTRAINT "GroupInvitation_groupId_Group_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "GroupInvitation" ADD CONSTRAINT "GroupInvitation_inviterId_User_id_fk" FOREIGN KEY ("inviterId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "GroupInvitation" ADD CONSTRAINT "GroupInvitation_inviteeId_User_id_fk" FOREIGN KEY ("inviteeId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_Group_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_invitedBy_User_id_fk" FOREIGN KEY ("invitedBy") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReportContent" ADD CONSTRAINT "ReportContent_reporterId_User_id_fk" FOREIGN KEY ("reporterId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReportContent" ADD CONSTRAINT "ReportContent_reviewedBy_User_id_fk" FOREIGN KEY ("reviewedBy") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_Achievement_id_fk" FOREIGN KEY ("achievementId") REFERENCES "public"."Achievement"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserFollowing" ADD CONSTRAINT "UserFollowing_followerId_User_id_fk" FOREIGN KEY ("followerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserFollowing" ADD CONSTRAINT "UserFollowing_followingId_User_id_fk" FOREIGN KEY ("followingId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserLevel" ADD CONSTRAINT "UserLevel_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Workshop" ADD CONSTRAINT "Workshop_instructorId_User_id_fk" FOREIGN KEY ("instructorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "WorkshopParticipant" ADD CONSTRAINT "WorkshopParticipant_workshopId_Workshop_id_fk" FOREIGN KEY ("workshopId") REFERENCES "public"."Workshop"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "WorkshopParticipant" ADD CONSTRAINT "WorkshopParticipant_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
