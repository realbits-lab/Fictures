import { sql } from "drizzle-orm";
import {
    boolean,
    foreignKey,
    index,
    integer,
    json,
    jsonb,
    pgEnum,
    pgTable,
    primaryKey,
    text,
    timestamp,
    unique,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";

export const adversityType = pgEnum("adversity_type", [
    "internal",
    "external",
    "both",
]);
export const arcPosition = pgEnum("arc_position", [
    "beginning",
    "middle",
    "climax",
    "resolution",
]);
export const comicStatus = pgEnum("comic_status", [
    "none",
    "draft",
    "published",
]);
export const contentType = pgEnum("content_type", [
    "markdown",
    "html",
    "plain",
]);
export const cyclePhase = pgEnum("cycle_phase", [
    "setup",
    "confrontation",
    "virtue",
    "consequence",
    "transition",
]);
export const emotionalBeat = pgEnum("emotional_beat", [
    "fear",
    "hope",
    "tension",
    "relief",
    "elevation",
    "catharsis",
    "despair",
    "joy",
]);
export const eventType = pgEnum("event_type", [
    "page_view",
    "story_view",
    "chapter_read_start",
    "chapter_read_complete",
    "scene_read",
    "comment_created",
    "comment_liked",
    "story_liked",
    "chapter_liked",
    "post_created",
    "post_viewed",
    "share",
    "bookmark",
]);
export const insightType = pgEnum("insight_type", [
    "quality_improvement",
    "engagement_drop",
    "reader_feedback",
    "pacing_issue",
    "character_development",
    "plot_consistency",
    "trending_up",
    "publishing_opportunity",
    "audience_mismatch",
]);
export const moderationStatus = pgEnum("moderation_status", [
    "approved",
    "pending",
    "flagged",
    "rejected",
]);
export const publicationStatus = pgEnum("publication_status", [
    "pending",
    "published",
    "failed",
    "cancelled",
]);
export const readingFormat = pgEnum("reading_format", ["novel", "comic"]);
export const scheduleType = pgEnum("schedule_type", [
    "daily",
    "weekly",
    "custom",
    "one-time",
]);
export const sessionType = pgEnum("session_type", [
    "continuous",
    "interrupted",
    "partial",
]);
export const sfxEmphasis = pgEnum("sfx_emphasis", [
    "normal",
    "large",
    "dramatic",
]);
export const shotType = pgEnum("shot_type", [
    "establishing_shot",
    "wide_shot",
    "medium_shot",
    "close_up",
    "extreme_close_up",
    "over_shoulder",
    "dutch_angle",
]);
export const status = pgEnum("status", ["writing", "published"]);
export const tone = pgEnum("tone", [
    "hopeful",
    "dark",
    "bittersweet",
    "satirical",
]);
export const userRole = pgEnum("user_role", ["reader", "writer", "manager"]);
export const virtueType = pgEnum("virtue_type", [
    "courage",
    "compassion",
    "integrity",
    "sacrifice",
    "loyalty",
    "wisdom",
]);
export const visibility = pgEnum("visibility", [
    "private",
    "unlisted",
    "public",
]);

export const characters = pgTable(
    "characters",
    {
        // === IDENTITY ===
        id: text().primaryKey().notNull(),
        storyId: text("story_id").notNull(),
        name: varchar({ length: 255 }).notNull(),
        isMain: boolean("is_main").default(false), // Main characters (2-4) get MACRO arcs
        summary: text(), // 1-2 sentence essence: "[CoreTrait] [role] [internalFlaw], seeking [externalGoal]"

        // === ADVERSITY-TRIUMPH CORE (The Engine) ===
        coreTrait: text("core_trait"), // THE defining moral virtue: "courage" | "compassion" | "integrity" | "loyalty" | "wisdom" | "sacrifice"
        internalFlaw: text("internal_flaw"), // MUST include cause: "[fears/believes/wounded by] X because Y"
        externalGoal: text("external_goal"), // What they THINK will solve their problem (healing flaw actually will)

        // === CHARACTER DEPTH (For Realistic Portrayal) ===
        personality: json(), // { traits: string[], values: string[] }
        backstory: text(), // Focused history providing motivation context (2-4 paragraphs)

        // === RELATIONSHIPS (Jeong System) ===
        relationships: json(), // { [characterId]: { type, jeongLevel, sharedHistory, currentDynamic } }

        // === PROSE GENERATION ===
        physicalDescription: json("physical_description"), // { age, appearance, distinctiveFeatures, style }
        voiceStyle: json("voice_style"), // { tone, vocabulary, quirks, emotionalRange }

        // === VISUAL GENERATION ===
        imageUrl: text("image_url"), // Original portrait (1024×1024 from DALL-E 3)
        imageVariants: json("image_variants"),

        // === METADATA ===
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_characters_story_id").using(
            "btree",
            table.storyId.asc().nullsLast().op("text_ops"),
        ),
        index("idx_characters_story_main").using(
            "btree",
            table.storyId.asc().nullsLast().op("text_ops"),
            table.isMain.desc().nullsFirst().op("text_ops"),
        ),
        foreignKey({
            columns: [table.storyId],
            foreignColumns: [stories.id],
            name: "characters_story_id_stories_id_fk",
        }),
    ],
);

export const settings = pgTable(
    "settings",
    {
        // === IDENTITY ===
        id: text().primaryKey().notNull(),
        storyId: text("story_id").notNull(),
        name: varchar({ length: 255 }).notNull(),
        summary: text(), // Comprehensive paragraph (3-5 sentences)

        // === ADVERSITY-TRIUMPH CORE (The Engine) ===
        // adversityElements: {
        //   physicalObstacles: string[];  // Environmental challenges
        //   scarcityFactors: string[];    // Limited resources that force choices
        //   dangerSources: string[];      // Threats from environment
        //   socialDynamics: string[];     // Community factors
        // }
        adversityElements: json("adversity_elements"),
        symbolicMeaning: text("symbolic_meaning"), // How setting reflects story's moral framework (1-2 sentences)
        // cycleAmplification: {
        //   setup: string;         // How setting establishes adversity
        //   confrontation: string; // How setting intensifies conflict
        //   virtue: string;        // How setting contrasts/witnesses moral beauty
        //   consequence: string;   // How setting transforms or reveals
        //   transition: string;    // How setting hints at new problems
        // }
        cycleAmplification: json("cycle_amplification"),

        // === EMOTIONAL ATMOSPHERE ===
        mood: text(), // Primary emotional quality: "oppressive and surreal", "hopeful but fragile"
        emotionalResonance: text("emotional_resonance"), // What emotion this amplifies: "isolation", "hope", "fear", "connection"

        // === SENSORY IMMERSION (For Prose Generation) ===
        // sensory: {
        //   sight: string[];   // Visual details (5-10 items)
        //   sound: string[];   // Auditory elements (3-7 items)
        //   smell: string[];   // Olfactory details (2-5 items)
        //   touch: string[];   // Tactile sensations (2-5 items)
        //   taste: string[];   // Flavor elements (0-2 items, optional)
        // }
        sensory: json(),
        architecturalStyle: text("architectural_style"), // Structural design language (if applicable)

        // === VISUAL GENERATION ===
        imageUrl: text("image_url"), // Original environment image (1792×1024, 16:9 from DALL-E 3)
        imageVariants: json("image_variants"),
        visualReferences: json("visual_references"), // Style inspirations: ["Blade Runner 2049", "Studio Ghibli countryside"]
        colorPalette: json("color_palette"), // Dominant colors: ["warm golds", "dusty browns", "deep greens"]

        // === METADATA ===
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_settings_story_id").using(
            "btree",
            table.storyId.asc().nullsLast().op("text_ops"),
        ),
        foreignKey({
            columns: [table.storyId],
            foreignColumns: [stories.id],
            name: "settings_story_id_stories_id_fk",
        }),
    ],
);

export const stories = pgTable(
    "stories",
    {
        // === IDENTITY ===
        id: text().primaryKey().notNull(),
        authorId: text("author_id").notNull(),
        title: varchar({ length: 255 }).notNull(),

        // === ADVERSITY-TRIUMPH CORE ===
        summary: text(), // General thematic premise and moral framework
        genre: varchar({ length: 100 }),
        tone: tone(), // "hopeful" | "dark" | "bittersweet" | "satirical"
        moralFramework: text("moral_framework"), // What virtues are valued in this world?

        // === PUBLISHING & ENGAGEMENT ===
        status: status().default("writing").notNull(),
        viewCount: integer("view_count").default(0),
        rating: integer().default(0),
        ratingCount: integer("rating_count").default(0),

        // === VISUAL ===
        imageUrl: text("image_url"),
        imageVariants: json("image_variants"),

        // === METADATA ===
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { mode: "string" })
            .defaultNow()
            .notNull(),

        // Note: Main characters (2-4 with isMain=true) stored in characters table
        // Note: Settings (2-6 primary) stored in settings table
    },
    (table) => [
        index("idx_stories_author_id").using(
            "btree",
            table.authorId.asc().nullsLast().op("text_ops"),
        ),
        index("idx_stories_status").using(
            "btree",
            table.status.asc().nullsLast().op("enum_ops"),
        ),
        index("idx_stories_status_updated")
            .using(
                "btree",
                table.status.asc().nullsLast().op("enum_ops"),
                table.updatedAt.desc().nullsFirst().op("timestamp_ops"),
            )
            .where(sql`(status = 'published'::status)`),
        index("idx_stories_view_count_published")
            .using("btree", table.viewCount.desc().nullsFirst().op("int4_ops"))
            .where(sql`(status = 'published'::status)`),
        foreignKey({
            columns: [table.authorId],
            foreignColumns: [users.id],
            name: "stories_author_id_users_id_fk",
        }),
    ],
);

export const parts = pgTable(
    "parts",
    {
        // === IDENTITY ===
        id: text().primaryKey().notNull(),
        storyId: text("story_id").notNull(),
        title: varchar({ length: 255 }).notNull(),

        // === ADVERSITY-TRIUMPH CORE (Act Structure) ===
        summary: text(), // MACRO adversity-triumph arcs per character with progression planning

        // === MACRO ARC TRACKING (Nested Cycles) ===
        // characterArcs: Array<{
        //   characterId: string;
        //   macroAdversity: { internal, external };
        //   macroVirtue: string;
        //   macroConsequence: string;
        //   macroNewAdversity: string;
        //   estimatedChapters: number;
        //   arcPosition: 'primary' | 'secondary';
        //   progressionStrategy: string;
        // }>
        characterArcs: json("character_arcs"),

        // === ORDERING ===
        orderIndex: integer("order_index"), // Act number / order

        // === METADATA ===
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_parts_order_index").using(
            "btree",
            table.orderIndex.asc().nullsLast().op("int4_ops"),
        ),
        index("idx_parts_story_id").using(
            "btree",
            table.storyId.asc().nullsLast().op("text_ops"),
        ),
        foreignKey({
            columns: [table.storyId],
            foreignColumns: [stories.id],
            name: "parts_story_id_stories_id_fk",
        }),
    ],
);

export const chapters = pgTable(
    "chapters",
    {
        // === IDENTITY ===
        id: text().primaryKey().notNull(),
        storyId: text("story_id").notNull(),
        partId: text("part_id"),
        title: varchar({ length: 255 }).notNull(),

        // === ADVERSITY-TRIUMPH CORE (Micro Cycle) ===
        summary: text(), // ONE complete adversity-triumph cycle

        // === NESTED CYCLE TRACKING (Links micro-cycle to macro arc) ===
        characterId: text("character_id"), // References Character.id (the character whose macro arc this chapter advances)
        arcPosition: arcPosition("arc_position"), // 'beginning' | 'middle' | 'climax' | 'resolution' (climax = MACRO moment)
        contributesToMacroArc: text("contributes_to_macro_arc"), // How this chapter advances the macro arc

        // === CYCLE TRACKING ===
        focusCharacters: json("focus_characters").default([]), // Character ID(s)
        adversityType: adversityType("adversity_type"), // 'internal' | 'external' | 'both'
        virtueType: virtueType("virtue_type"), // 'courage' | 'compassion' | 'integrity' | 'sacrifice' | 'loyalty' | 'wisdom'

        // === CAUSAL LINKING (For Earned Luck) ===
        // seedsPlanted: Array<{ id, description, expectedPayoff }>
        seedsPlanted: json("seeds_planted").default([]),
        // seedsResolved: Array<{ sourceChapterId, sourceSceneId, seedId, payoffDescription }>
        seedsResolved: json("seeds_resolved").default([]),

        // === CONNECTION TO NARRATIVE FLOW ===
        connectsToPreviousChapter: text("connects_to_previous_chapter"), // How previous resolution created this adversity
        createsNextAdversity: text("creates_next_adversity"), // How this resolution creates next problem

        // === PUBLISHING ===
        status: status().default("writing").notNull(),
        publishedAt: timestamp("published_at", { mode: "string" }),
        scheduledFor: timestamp("scheduled_for", { mode: "string" }),

        // === ORDERING ===
        orderIndex: integer("order_index").notNull(),

        // === METADATA ===
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_chapters_order_index").using(
            "btree",
            table.orderIndex.asc().nullsLast().op("int4_ops"),
        ),
        index("idx_chapters_part_id").using(
            "btree",
            table.partId.asc().nullsLast().op("text_ops"),
        ),
        index("idx_chapters_status").using(
            "btree",
            table.status.asc().nullsLast().op("enum_ops"),
        ),
        index("idx_chapters_story_id").using(
            "btree",
            table.storyId.asc().nullsLast().op("text_ops"),
        ),
        foreignKey({
            columns: [table.storyId],
            foreignColumns: [stories.id],
            name: "chapters_story_id_stories_id_fk",
        }),
        foreignKey({
            columns: [table.partId],
            foreignColumns: [parts.id],
            name: "chapters_part_id_parts_id_fk",
        }),
        foreignKey({
            columns: [table.characterId],
            foreignColumns: [characters.id],
            name: "chapters_characterId_characters_id_fk",
        }).onDelete("set null"),
    ],
);

export const scenes = pgTable(
    "scenes",
    {
        // === IDENTITY ===
        id: text().primaryKey().notNull(),
        chapterId: text("chapter_id").notNull(),
        title: varchar({ length: 255 }).notNull(),

        // === SCENE SPECIFICATION (Planning Layer) ===
        summary: text(), // Scene specification: what happens, emotional beat, purpose, sensory anchors

        // === CYCLE PHASE TRACKING ===
        cyclePhase: cyclePhase("cycle_phase"), // 'setup' | 'confrontation' | 'virtue' | 'consequence' | 'transition'
        emotionalBeat: emotionalBeat("emotional_beat"), // 'fear' | 'hope' | 'tension' | 'relief' | 'elevation' | 'catharsis' | 'despair' | 'joy'

        // === PLANNING METADATA (Guides Content Generation) ===
        characterFocus: jsonb("character_focus").default([]), // Character IDs appearing in this scene
        settingId: text("setting_id"), // Setting ID where this scene takes place (references Setting.id, nullable for legacy/ambiguous scenes)
        sensoryAnchors: jsonb("sensory_anchors").default([]), // Key sensory details to include (e.g., "rain on metal roof", "smell of smoke")
        dialogueVsDescription: text("dialogue_vs_description"), // Balance guidance (e.g., "60% dialogue, 40% description")
        suggestedLength: text("suggested_length"), // 'short' | 'medium' | 'long' (short: 300-500, medium: 500-800, long: 800-1000 words)

        // === GENERATED PROSE (Execution Layer) ===
        content: text().default(""), // Full prose narrative generated from summary

        // === VISUAL ===
        imageUrl: text("image_url"),
        imageVariants: json("image_variants"),

        // === PUBLISHING (Novel Format) ===
        visibility: visibility().default("private").notNull(),
        publishedAt: timestamp("published_at", { mode: "string" }),
        publishedBy: text("published_by"),
        unpublishedAt: timestamp("unpublished_at", { mode: "string" }),
        unpublishedBy: text("unpublished_by"),
        scheduledFor: timestamp("scheduled_for", { mode: "string" }),
        autoPublish: boolean("auto_publish").default(false),

        // === COMIC FORMAT ===
        comicStatus: comicStatus("comic_status").default("none").notNull(),
        comicPublishedAt: timestamp("comic_published_at", { mode: "string" }),
        comicPublishedBy: text("comic_published_by"),
        comicUnpublishedAt: timestamp("comic_unpublished_at", {
            mode: "string",
        }),
        comicUnpublishedBy: text("comic_unpublished_by"),
        comicGeneratedAt: timestamp("comic_generated_at", { mode: "string" }),
        comicPanelCount: integer("comic_panel_count").default(0),
        comicVersion: integer("comic_version").default(1),

        // === ANALYTICS ===
        viewCount: integer("view_count").default(0).notNull(),
        uniqueViewCount: integer("unique_view_count").default(0).notNull(),
        novelViewCount: integer("novel_view_count").default(0).notNull(),
        novelUniqueViewCount: integer("novel_unique_view_count")
            .default(0)
            .notNull(),
        comicViewCount: integer("comic_view_count").default(0).notNull(),
        comicUniqueViewCount: integer("comic_unique_view_count")
            .default(0)
            .notNull(),
        lastViewedAt: timestamp("last_viewed_at", { mode: "string" }),

        // === ORDERING ===
        orderIndex: integer("order_index").notNull(),

        // === METADATA ===
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_scenes_chapter_id").using(
            "btree",
            table.chapterId.asc().nullsLast().op("text_ops"),
        ),
        index("idx_scenes_character_focus").using(
            "gin",
            table.characterFocus.asc().nullsLast().op("jsonb_ops"),
        ),
        index("idx_scenes_order_index").using(
            "btree",
            table.orderIndex.asc().nullsLast().op("int4_ops"),
        ),
        index("idx_scenes_suggested_length").using(
            "btree",
            table.suggestedLength.asc().nullsLast().op("text_ops"),
        ),
        index("idx_scenes_visibility").using(
            "btree",
            table.visibility.asc().nullsLast().op("enum_ops"),
        ),
        foreignKey({
            columns: [table.chapterId],
            foreignColumns: [chapters.id],
            name: "scenes_chapter_id_chapters_id_fk",
        }),
        foreignKey({
            columns: [table.publishedBy],
            foreignColumns: [users.id],
            name: "scenes_published_by_users_id_fk",
        }),
        foreignKey({
            columns: [table.unpublishedBy],
            foreignColumns: [users.id],
            name: "scenes_unpublished_by_users_id_fk",
        }),
        foreignKey({
            columns: [table.comicPublishedBy],
            foreignColumns: [users.id],
            name: "scenes_comic_published_by_users_id_fk",
        }),
        foreignKey({
            columns: [table.comicUnpublishedBy],
            foreignColumns: [users.id],
            name: "scenes_comic_unpublished_by_users_id_fk",
        }),
    ],
);

export const communityReplies = pgTable(
    "community_replies",
    {
        id: text().primaryKey().notNull(),
        content: text().notNull(),
        contentType: contentType("content_type").default("markdown").notNull(),
        contentHtml: text("content_html"),
        contentImages: json("content_images").default([]),
        postId: text("post_id").notNull(),
        authorId: text("author_id").notNull(),
        parentReplyId: text("parent_reply_id"),
        depth: integer().default(0).notNull(),
        isEdited: boolean("is_edited").default(false),
        editCount: integer("edit_count").default(0),
        lastEditedAt: timestamp("last_edited_at", { mode: "string" }),
        isDeleted: boolean("is_deleted").default(false),
        deletedAt: timestamp("deleted_at", { mode: "string" }),
        likes: integer().default(0),
        mentions: json().default([]),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.postId],
            foreignColumns: [communityPosts.id],
            name: "community_replies_post_id_community_posts_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.authorId],
            foreignColumns: [users.id],
            name: "community_replies_author_id_users_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.parentReplyId],
            foreignColumns: [table.id],
            name: "community_replies_parent_reply_id_community_replies_id_fk",
        }).onDelete("cascade"),
    ],
);

export const studioAgentChats = pgTable(
    "studio_agent_chats",
    {
        id: uuid().defaultRandom().primaryKey().notNull(),
        userId: text("user_id").notNull(),
        storyId: text("story_id"),
        agentType: varchar("agent_type", { length: 50 }).notNull(),
        title: varchar({ length: 255 }).notNull(),
        context: json(),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("studio_agent_chats_agent_type_idx").using(
            "btree",
            table.agentType.asc().nullsLast().op("text_ops"),
        ),
        index("studio_agent_chats_story_id_idx").using(
            "btree",
            table.storyId.asc().nullsLast().op("text_ops"),
        ),
        index("studio_agent_chats_user_id_idx").using(
            "btree",
            table.userId.asc().nullsLast().op("text_ops"),
        ),
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "studio_agent_chats_user_id_fkey",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.storyId],
            foreignColumns: [stories.id],
            name: "studio_agent_chats_story_id_fkey",
        }).onDelete("cascade"),
    ],
);

export const users = pgTable(
    "users",
    {
        id: text().primaryKey().notNull(),
        name: text(),
        email: text().notNull(),
        emailVerified: timestamp("email_verified", { mode: "string" }),
        image: text(),
        username: varchar({ length: 50 }),
        password: varchar({ length: 255 }),
        bio: text(),
        role: userRole().default("reader").notNull(),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [unique("users_username_unique").on(table.username)],
);

export const apiKeys = pgTable(
    "api_keys",
    {
        id: text().primaryKey().notNull(),
        userId: text("user_id").notNull(),
        name: varchar({ length: 255 }).default("API Key").notNull(),
        keyHash: varchar("key_hash", { length: 64 }).notNull(),
        keyPrefix: varchar("key_prefix", { length: 16 }).notNull(),
        scopes: json().default([]).notNull(),
        lastUsedAt: timestamp("last_used_at", { mode: "string" }),
        expiresAt: timestamp("expires_at", { mode: "string" }),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "api_keys_user_id_users_id_fk",
        }).onDelete("cascade"),
        unique("api_keys_key_hash_unique").on(table.keyHash),
    ],
);

export const aiInteractions = pgTable(
    "ai_interactions",
    {
        id: text().primaryKey().notNull(),
        userId: text("user_id").notNull(),
        type: varchar({ length: 100 }).notNull(),
        prompt: text().notNull(),
        response: text().notNull(),
        applied: boolean().default(false),
        rating: integer(),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "ai_interactions_user_id_users_id_fk",
        }),
    ],
);

export const analyticsEvents = pgTable(
    "analytics_events",
    {
        id: text().primaryKey().notNull(),
        eventType: eventType("event_type").notNull(),
        userId: text("user_id"),
        sessionId: text("session_id").notNull(),
        storyId: text("story_id"),
        chapterId: text("chapter_id"),
        sceneId: text("scene_id"),
        postId: text("post_id"),
        metadata: json().default({}),
        timestamp: timestamp({ mode: "string" }).defaultNow().notNull(),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_analytics_events_user").using(
            "btree",
            table.userId.asc().nullsLast().op("text_ops"),
        ),
        index("idx_analytics_events_session").using(
            "btree",
            table.sessionId.asc().nullsLast().op("text_ops"),
        ),
        index("idx_analytics_events_story").using(
            "btree",
            table.storyId.asc().nullsLast().op("text_ops"),
        ),
        index("idx_analytics_events_type").using(
            "btree",
            table.eventType.asc().nullsLast().op("enum_ops"),
        ),
        index("idx_analytics_events_timestamp").using(
            "btree",
            table.timestamp.asc().nullsLast().op("timestamp_ops"),
        ),
        index("idx_analytics_events_user_timestamp").using(
            "btree",
            table.userId.asc().nullsLast().op("text_ops"),
            table.timestamp.asc().nullsLast().op("timestamp_ops"),
        ),
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "analytics_events_user_id_users_id_fk",
        }).onDelete("set null"),
        foreignKey({
            columns: [table.storyId],
            foreignColumns: [stories.id],
            name: "analytics_events_story_id_stories_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.chapterId],
            foreignColumns: [chapters.id],
            name: "analytics_events_chapter_id_chapters_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.sceneId],
            foreignColumns: [scenes.id],
            name: "analytics_events_scene_id_scenes_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.postId],
            foreignColumns: [communityPosts.id],
            name: "analytics_events_post_id_community_posts_id_fk",
        }).onDelete("cascade"),
    ],
);

export const comments = pgTable(
    "comments",
    {
        id: text().primaryKey().notNull(),
        content: text().notNull(),
        userId: text("user_id").notNull(),
        storyId: text("story_id").notNull(),
        chapterId: text("chapter_id"),
        sceneId: text("scene_id"),
        parentCommentId: text("parent_comment_id"),
        depth: integer().default(0).notNull(),
        likeCount: integer("like_count").default(0).notNull(),
        dislikeCount: integer("dislike_count").default(0).notNull(),
        replyCount: integer("reply_count").default(0).notNull(),
        isEdited: boolean("is_edited").default(false).notNull(),
        isDeleted: boolean("is_deleted").default(false).notNull(),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "comments_user_id_users_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.storyId],
            foreignColumns: [stories.id],
            name: "comments_story_id_stories_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.chapterId],
            foreignColumns: [chapters.id],
            name: "comments_chapter_id_chapters_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.sceneId],
            foreignColumns: [scenes.id],
            name: "comments_scene_id_scenes_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.parentCommentId],
            foreignColumns: [table.id],
            name: "comments_parent_comment_id_comments_id_fk",
        }).onDelete("cascade"),
    ],
);

export const communityPosts = pgTable(
    "community_posts",
    {
        id: text().primaryKey().notNull(),
        title: varchar({ length: 255 }).notNull(),
        content: text().notNull(),
        contentType: contentType("content_type").default("markdown").notNull(),
        contentHtml: text("content_html"),
        contentImages: json("content_images").default([]),
        storyId: text("story_id").notNull(),
        authorId: text("author_id").notNull(),
        type: varchar({ length: 50 }).default("discussion"),
        isPinned: boolean("is_pinned").default(false),
        isLocked: boolean("is_locked").default(false),
        isEdited: boolean("is_edited").default(false),
        editCount: integer("edit_count").default(0),
        lastEditedAt: timestamp("last_edited_at", { mode: "string" }),
        isDeleted: boolean("is_deleted").default(false),
        deletedAt: timestamp("deleted_at", { mode: "string" }),
        likes: integer().default(0),
        replies: integer().default(0),
        views: integer().default(0),
        moderationStatus:
            moderationStatus("moderation_status").default("approved"),
        moderationReason: text("moderation_reason"),
        moderatedBy: text("moderated_by"),
        moderatedAt: timestamp("moderated_at", { mode: "string" }),
        tags: json().default([]),
        mentions: json().default([]),
        lastActivityAt: timestamp("last_activity_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_community_posts_author_id").using(
            "btree",
            table.authorId.asc().nullsLast().op("text_ops"),
        ),
        index("idx_community_posts_content_search").using(
            "gin",
            sql`to_tsvector('english'::regconfig, content)`,
        ),
        index("idx_community_posts_created_at").using(
            "btree",
            table.createdAt.desc().nullsFirst().op("timestamp_ops"),
        ),
        index("idx_community_posts_story_created").using(
            "btree",
            table.storyId.asc().nullsLast().op("text_ops"),
            table.createdAt.desc().nullsFirst().op("text_ops"),
        ),
        index("idx_community_posts_story_id").using(
            "btree",
            table.storyId.asc().nullsLast().op("text_ops"),
        ),
        index("idx_community_posts_title_search").using(
            "gin",
            sql`to_tsvector('english'::regconfig, (title)::text)`,
        ),
        foreignKey({
            columns: [table.storyId],
            foreignColumns: [stories.id],
            name: "community_posts_story_id_stories_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.authorId],
            foreignColumns: [users.id],
            name: "community_posts_author_id_users_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.moderatedBy],
            foreignColumns: [users.id],
            name: "community_posts_moderated_by_users_id_fk",
        }),
    ],
);

export const publishingSchedules = pgTable(
    "publishing_schedules",
    {
        id: text().primaryKey().notNull(),
        storyId: text("story_id").notNull(),
        chapterId: text("chapter_id"),
        createdBy: text("created_by").notNull(),
        name: varchar({ length: 255 }).notNull(),
        description: text(),
        scheduleType: scheduleType("schedule_type").notNull(),
        startDate: text("start_date").notNull(),
        endDate: text("end_date"),
        publishTime: text("publish_time").default("09:00:00").notNull(),
        intervalDays: integer("interval_days"),
        daysOfWeek: json("days_of_week"),
        scenesPerPublish: integer("scenes_per_publish").default(1),
        isActive: boolean("is_active").default(true),
        isCompleted: boolean("is_completed").default(false),
        lastPublishedAt: timestamp("last_published_at", { mode: "string" }),
        nextPublishAt: timestamp("next_publish_at", { mode: "string" }),
        totalPublished: integer("total_published").default(0),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.storyId],
            foreignColumns: [stories.id],
            name: "publishing_schedules_story_id_stories_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.chapterId],
            foreignColumns: [chapters.id],
            name: "publishing_schedules_chapter_id_chapters_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.createdBy],
            foreignColumns: [users.id],
            name: "publishing_schedules_created_by_users_id_fk",
        }),
    ],
);

export const userPreferences = pgTable(
    "user_preferences",
    {
        id: text().primaryKey().notNull(),
        userId: text("user_id").notNull(),
        theme: varchar({ length: 20 }).default("system"),
        language: varchar({ length: 10 }).default("en"),
        timezone: varchar({ length: 50 }).default("UTC"),
        emailNotifications: boolean("email_notifications").default(true),
        pushNotifications: boolean("push_notifications").default(false),
        marketingEmails: boolean("marketing_emails").default(false),
        profileVisibility: varchar("profile_visibility", {
            length: 20,
        }).default("public"),
        showEmail: boolean("show_email").default(false),
        showStats: boolean("show_stats").default(true),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "user_preferences_userId_users_id_fk",
        }).onDelete("cascade"),
    ],
);

export const userStats = pgTable(
    "user_stats",
    {
        id: text().primaryKey().notNull(),
        userId: text("user_id").notNull(),
        totalWordsWritten: integer("total_words_written").default(0),
        storiesPublished: integer("stories_published").default(0),
        chaptersPublished: integer("chapters_published").default(0),
        commentsReceived: integer("comments_received").default(0),
        totalViews: integer("total_views").default(0),
        averageRating: integer("average_rating").default(0),
        writingStreak: integer("writing_streak").default(0),
        bestStreak: integer("best_streak").default(0),
        level: integer().default(1),
        experience: integer().default(0),
        lastWritingDate: timestamp("last_writing_date", { mode: "string" }),
        updatedAt: timestamp("updated_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "user_stats_user_id_users_id_fk",
        }),
    ],
);

export const readingHistory = pgTable(
    "reading_history",
    {
        id: text().primaryKey().notNull(),
        userId: text("user_id").notNull(),
        storyId: text("story_id").notNull(),
        readingFormat: readingFormat("reading_format")
            .default("novel")
            .notNull(),
        lastReadAt: timestamp("last_read_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        readCount: integer("read_count").default(1).notNull(),
        lastSceneId: text("last_scene_id"),
        lastPanelId: text("last_panel_id"),
        lastPageNumber: integer("last_page_number"),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "reading_history_user_id_users_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.storyId],
            foreignColumns: [stories.id],
            name: "reading_history_story_id_stories_id_fk",
        }).onDelete("cascade"),
        unique("user_story_format_unique").on(
            table.userId,
            table.storyId,
            table.readingFormat,
        ),
    ],
);

export const readingSessions = pgTable(
    "reading_sessions",
    {
        id: text().primaryKey().notNull(),
        userId: text("user_id"),
        sessionId: text("session_id").notNull(),
        storyId: text("story_id"),
        startTime: timestamp("start_time", { mode: "string" }).notNull(),
        endTime: timestamp("end_time", { mode: "string" }),
        durationSeconds: integer("duration_seconds"),
        chaptersRead: integer("chapters_read").default(0),
        scenesRead: integer("scenes_read").default(0),
        charactersRead: integer("characters_read").default(0),
        sessionType: sessionType("session_type").default("continuous"),
        deviceType: varchar("device_type", { length: 20 }),
        completedStory: boolean("completed_story").default(false),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_reading_sessions_user").using(
            "btree",
            table.userId.asc().nullsLast().op("text_ops"),
        ),
        index("idx_reading_sessions_story").using(
            "btree",
            table.storyId.asc().nullsLast().op("text_ops"),
        ),
        index("idx_reading_sessions_start_time").using(
            "btree",
            table.startTime.asc().nullsLast().op("timestamp_ops"),
        ),
        index("idx_reading_sessions_duration").using(
            "btree",
            table.durationSeconds.asc().nullsLast().op("int4_ops"),
        ),
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "reading_sessions_user_id_users_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.storyId],
            foreignColumns: [stories.id],
            name: "reading_sessions_story_id_stories_id_fk",
        }).onDelete("cascade"),
    ],
);

export const storyInsights = pgTable(
    "story_insights",
    {
        id: text().primaryKey().notNull(),
        storyId: text("story_id").notNull(),
        insightType: insightType("insight_type").notNull(),
        title: varchar({ length: 255 }).notNull(),
        description: text().notNull(),
        severity: varchar({ length: 20 }).default("info"),
        actionItems: json("action_items").default([]),
        metrics: json().default({}),
        aiModel: varchar("ai_model", { length: 50 }),
        confidenceScore: varchar("confidence_score", { length: 10 }),
        isRead: boolean("is_read").default(false),
        isDismissed: boolean("is_dismissed").default(false),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        expiresAt: timestamp("expires_at", { mode: "string" }),
    },
    (table) => [
        index("idx_story_insights_story").using(
            "btree",
            table.storyId.asc().nullsLast().op("text_ops"),
        ),
        index("idx_story_insights_type").using(
            "btree",
            table.insightType.asc().nullsLast().op("enum_ops"),
        ),
        index("idx_story_insights_created").using(
            "btree",
            table.createdAt.desc().nullsFirst().op("timestamp_ops"),
        ),
        index("idx_story_insights_unread").using(
            "btree",
            table.storyId.asc().nullsLast().op("text_ops"),
            table.isRead.asc().nullsLast().op("bool_ops"),
        ),
        foreignKey({
            columns: [table.storyId],
            foreignColumns: [stories.id],
            name: "story_insights_story_id_stories_id_fk",
        }).onDelete("cascade"),
    ],
);

export const postViews = pgTable(
    "post_views",
    {
        id: text().primaryKey().notNull(),
        postId: text("post_id").notNull(),
        userId: text("user_id"),
        sessionId: varchar("session_id", { length: 255 }),
        ipHash: varchar("ip_hash", { length: 64 }),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.postId],
            foreignColumns: [communityPosts.id],
            name: "post_views_post_id_community_posts_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "post_views_user_id_users_id_fk",
        }).onDelete("cascade"),
    ],
);

export const studioAgentMessages = pgTable(
    "studio_agent_messages",
    {
        id: uuid().defaultRandom().primaryKey().notNull(),
        chatId: uuid("chat_id").notNull(),
        role: varchar({ length: 20 }).notNull(),
        content: text().notNull(),
        parts: json(),
        reasoning: text(),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("studio_agent_messages_chat_id_idx").using(
            "btree",
            table.chatId.asc().nullsLast().op("uuid_ops"),
        ),
        index("studio_agent_messages_created_at_idx").using(
            "btree",
            table.createdAt.asc().nullsLast().op("timestamp_ops"),
        ),
        foreignKey({
            columns: [table.chatId],
            foreignColumns: [studioAgentChats.id],
            name: "studio_agent_messages_chat_id_fkey",
        }).onDelete("cascade"),
    ],
);

export const comicPanels = pgTable(
    "comic_panels",
    {
        id: text().primaryKey().notNull(),
        sceneId: text("scene_id").notNull(),
        panelNumber: integer("panel_number").notNull(),
        shotType: shotType("shot_type").notNull(),
        imageUrl: text("image_url").notNull(),
        imageVariants: json("image_variants"),
        narrative: text(),
        dialogue: json(),
        sfx: json(),
        description: text(),
        metadata: json(),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.sceneId],
            foreignColumns: [scenes.id],
            name: "comic_panels_scene_id_scenes_id_fk",
        }).onDelete("cascade"),
    ],
);

export const sceneEvaluations = pgTable(
    "scene_evaluations",
    {
        id: text().primaryKey().notNull(),
        sceneId: text("scene_id").notNull(),
        evaluation: json().notNull(),
        overallScore: varchar("overall_score", { length: 10 }).notNull(),
        plotScore: varchar("plot_score", { length: 10 }).notNull(),
        characterScore: varchar("character_score", { length: 10 }).notNull(),
        pacingScore: varchar("pacing_score", { length: 10 }).notNull(),
        proseScore: varchar("prose_score", { length: 10 }).notNull(),
        worldBuildingScore: varchar("world_building_score", {
            length: 10,
        }).notNull(),
        modelVersion: varchar("model_version", { length: 50 }).default(
            "gpt-4o-mini",
        ),
        tokenUsage: integer("token_usage"),
        evaluationTimeMs: integer("evaluation_time_ms"),
        evaluatedAt: timestamp("evaluated_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.sceneId],
            foreignColumns: [scenes.id],
            name: "scene_evaluations_scene_id_scenes_id_fk",
        }).onDelete("cascade"),
    ],
);

export const sceneViews = pgTable(
    "scene_views",
    {
        id: text().default("gen_random_uuid()").primaryKey().notNull(),
        sceneId: text("scene_id").notNull(),
        userId: text("user_id"),
        sessionId: text("session_id"),
        readingFormat: readingFormat("reading_format")
            .default("novel")
            .notNull(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        viewedAt: timestamp("viewed_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.sceneId],
            foreignColumns: [scenes.id],
            name: "scene_views_scene_id_scenes_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "scene_views_user_id_users_id_fk",
        }).onDelete("set null"),
    ],
);

export const studioAgentToolExecutions = pgTable(
    "studio_agent_tool_executions",
    {
        id: uuid().defaultRandom().primaryKey().notNull(),
        messageId: uuid("message_id").notNull(),
        toolName: varchar("tool_name", { length: 100 }).notNull(),
        toolInput: json("tool_input").notNull(),
        toolOutput: json("tool_output"),
        status: varchar({ length: 20 }).notNull(),
        error: text(),
        executionTimeMs: integer("execution_time_ms"),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        completedAt: timestamp("completed_at", { mode: "string" }),
    },
    (table) => [
        index("studio_agent_tool_executions_message_id_idx").using(
            "btree",
            table.messageId.asc().nullsLast().op("uuid_ops"),
        ),
        index("studio_agent_tool_executions_tool_name_idx").using(
            "btree",
            table.toolName.asc().nullsLast().op("text_ops"),
        ),
        foreignKey({
            columns: [table.messageId],
            foreignColumns: [studioAgentMessages.id],
            name: "studio_agent_tool_executions_message_id_fkey",
        }).onDelete("cascade"),
    ],
);

export const storyLikes = pgTable(
    "story_likes",
    {
        userId: text("user_id").notNull(),
        storyId: text("story_id").notNull(),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "story_likes_user_id_users_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.storyId],
            foreignColumns: [stories.id],
            name: "story_likes_story_id_stories_id_fk",
        }).onDelete("cascade"),
        primaryKey({
            columns: [table.userId, table.storyId],
            name: "story_likes_user_id_story_id_pk",
        }),
    ],
);

export const chapterLikes = pgTable(
    "chapter_likes",
    {
        userId: text("user_id").notNull(),
        chapterId: text("chapter_id").notNull(),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "chapter_likes_user_id_users_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.chapterId],
            foreignColumns: [chapters.id],
            name: "chapter_likes_chapter_id_chapters_id_fk",
        }).onDelete("cascade"),
        primaryKey({
            columns: [table.userId, table.chapterId],
            name: "chapter_likes_user_id_chapter_id_pk",
        }),
    ],
);

export const commentDislikes = pgTable(
    "comment_dislikes",
    {
        commentId: text("comment_id").notNull(),
        userId: text("user_id").notNull(),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.commentId],
            foreignColumns: [comments.id],
            name: "comment_dislikes_comment_id_comments_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "comment_dislikes_user_id_users_id_fk",
        }).onDelete("cascade"),
        primaryKey({
            columns: [table.commentId, table.userId],
            name: "comment_dislikes_comment_id_user_id_pk",
        }),
    ],
);

export const commentLikes = pgTable(
    "comment_likes",
    {
        commentId: text("comment_id").notNull(),
        userId: text("user_id").notNull(),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.commentId],
            foreignColumns: [comments.id],
            name: "comment_likes_comment_id_comments_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "comment_likes_user_id_users_id_fk",
        }).onDelete("cascade"),
        primaryKey({
            columns: [table.commentId, table.userId],
            name: "comment_likes_comment_id_user_id_pk",
        }),
    ],
);

export const postLikes = pgTable(
    "post_likes",
    {
        postId: text("post_id").notNull(),
        userId: text("user_id").notNull(),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.postId],
            foreignColumns: [communityPosts.id],
            name: "post_likes_post_id_community_posts_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "post_likes_user_id_users_id_fk",
        }).onDelete("cascade"),
        primaryKey({
            columns: [table.postId, table.userId],
            name: "post_likes_post_id_user_id_pk",
        }),
    ],
);

export const sceneDislikes = pgTable(
    "scene_dislikes",
    {
        userId: text("user_id").notNull(),
        sceneId: text("scene_id").notNull(),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "scene_dislikes_user_id_users_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.sceneId],
            foreignColumns: [scenes.id],
            name: "scene_dislikes_scene_id_scenes_id_fk",
        }).onDelete("cascade"),
        primaryKey({
            columns: [table.userId, table.sceneId],
            name: "scene_dislikes_user_id_scene_id_pk",
        }),
    ],
);

export const sceneLikes = pgTable(
    "scene_likes",
    {
        userId: text("user_id").notNull(),
        sceneId: text("scene_id").notNull(),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "scene_likes_user_id_users_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.sceneId],
            foreignColumns: [scenes.id],
            name: "scene_likes_scene_id_scenes_id_fk",
        }).onDelete("cascade"),
        primaryKey({
            columns: [table.userId, table.sceneId],
            name: "scene_likes_user_id_scene_id_pk",
        }),
    ],
);

export const recommendationFeedback = pgTable(
    "recommendation_feedback",
    {
        id: text().primaryKey().notNull(),
        insightId: text("insight_id").notNull(),
        userId: text("user_id").notNull(),
        actionTaken: varchar("action_taken", { length: 50 }).notNull(),
        feedbackText: text("feedback_text"),
        wasHelpful: boolean("was_helpful"),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_recommendation_feedback_insight").using(
            "btree",
            table.insightId.asc().nullsLast().op("text_ops"),
        ),
        index("idx_recommendation_feedback_user").using(
            "btree",
            table.userId.asc().nullsLast().op("text_ops"),
        ),
        foreignKey({
            columns: [table.insightId],
            foreignColumns: [storyInsights.id],
            name: "recommendation_feedback_insight_id_story_insights_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "recommendation_feedback_user_id_users_id_fk",
        }).onDelete("cascade"),
    ],
);

export const dailyStoryMetrics = pgTable(
    "daily_story_metrics",
    {
        id: text().primaryKey().notNull(),
        storyId: text("story_id").notNull(),
        date: timestamp("date", { mode: "string" }).notNull(),
        totalViews: integer("total_views").default(0),
        uniqueReaders: integer("unique_readers").default(0),
        newReaders: integer("new_readers").default(0),
        comments: integer("comments").default(0),
        likes: integer("likes").default(0),
        shares: integer("shares").default(0),
        bookmarks: integer("bookmarks").default(0),
        engagementRate: varchar("engagement_rate", { length: 10 }).default("0"),
        avgSessionDuration: integer("avg_session_duration").default(0),
        totalSessions: integer("total_sessions").default(0),
        completedSessions: integer("completed_sessions").default(0),
        completionRate: varchar("completion_rate", { length: 10 }).default("0"),
        avgChaptersPerSession: varchar("avg_chapters_per_session", {
            length: 10,
        }).default("0"),
        mobileUsers: integer("mobile_users").default(0),
        desktopUsers: integer("desktop_users").default(0),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_daily_metrics_story_date").using(
            "btree",
            table.storyId.asc().nullsLast().op("text_ops"),
            table.date.asc().nullsLast().op("timestamp_ops"),
        ),
        unique("daily_metrics_story_date_unique").on(table.storyId, table.date),
        foreignKey({
            columns: [table.storyId],
            foreignColumns: [stories.id],
            name: "daily_story_metrics_story_id_stories_id_fk",
        }).onDelete("cascade"),
    ],
);

export const scheduledPublications = pgTable(
    "scheduled_publications",
    {
        id: text().primaryKey().notNull(),
        scheduleId: text("schedule_id"),
        storyId: text("story_id").notNull(),
        chapterId: text("chapter_id"),
        sceneId: text("scene_id"),
        scheduledFor: timestamp("scheduled_for", { mode: "string" }).notNull(),
        publishedAt: timestamp("published_at", { mode: "string" }),
        status: publicationStatus().default("pending").notNull(),
        errorMessage: text("error_message"),
        retryCount: integer("retry_count").default(0),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.scheduleId],
            foreignColumns: [publishingSchedules.id],
            name: "scheduled_publications_schedule_id_publishing_schedules_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.storyId],
            foreignColumns: [stories.id],
            name: "scheduled_publications_story_id_stories_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.chapterId],
            foreignColumns: [chapters.id],
            name: "scheduled_publications_chapter_id_chapters_id_fk",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.sceneId],
            foreignColumns: [scenes.id],
            name: "scheduled_publications_scene_id_scenes_id_fk",
        }).onDelete("cascade"),
    ],
);
