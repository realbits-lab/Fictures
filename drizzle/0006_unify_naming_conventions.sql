-- Migration: Unify database naming conventions to snake_case
-- Description: Rename all camelCase columns to snake_case for PostgreSQL standard compliance
-- Date: 2025-01-01
-- Related: Issue #53 - Database naming convention unification

-- This migration converts all camelCase column names to snake_case
-- to align with PostgreSQL naming conventions while using Drizzle's
-- automatic casing feature for transparent TypeScript ↔ PostgreSQL mapping

-- Table: users (3 columns)
ALTER TABLE users RENAME COLUMN "emailVerified" TO email_verified;
ALTER TABLE users RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE users RENAME COLUMN "updatedAt" TO updated_at;

-- Table: user_preferences (9 columns)
ALTER TABLE user_preferences RENAME COLUMN "userId" TO user_id;
ALTER TABLE user_preferences RENAME COLUMN "emailNotifications" TO email_notifications;
ALTER TABLE user_preferences RENAME COLUMN "pushNotifications" TO push_notifications;
ALTER TABLE user_preferences RENAME COLUMN "marketingEmails" TO marketing_emails;
ALTER TABLE user_preferences RENAME COLUMN "profileVisibility" TO profile_visibility;
ALTER TABLE user_preferences RENAME COLUMN "showEmail" TO show_email;
ALTER TABLE user_preferences RENAME COLUMN "showStats" TO show_stats;
ALTER TABLE user_preferences RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE user_preferences RENAME COLUMN "updatedAt" TO updated_at;

-- Table: parts (2 columns)
ALTER TABLE parts RENAME COLUMN "actNumber" TO act_number;
ALTER TABLE parts RENAME COLUMN "characterArcs" TO character_arcs;

-- Table: chapters (10 columns)
ALTER TABLE chapters RENAME COLUMN "characterId" TO character_id;
ALTER TABLE chapters RENAME COLUMN "arcPosition" TO arc_position;
ALTER TABLE chapters RENAME COLUMN "contributesToMacroArc" TO contributes_to_macro_arc;
ALTER TABLE chapters RENAME COLUMN "focusCharacters" TO focus_characters;
ALTER TABLE chapters RENAME COLUMN "adversityType" TO adversity_type;
ALTER TABLE chapters RENAME COLUMN "virtueType" TO virtue_type;
ALTER TABLE chapters RENAME COLUMN "seedsPlanted" TO seeds_planted;
ALTER TABLE chapters RENAME COLUMN "seedsResolved" TO seeds_resolved;
ALTER TABLE chapters RENAME COLUMN "connectsToPreviousChapter" TO connects_to_previous_chapter;
ALTER TABLE chapters RENAME COLUMN "createsNextAdversity" TO creates_next_adversity;

-- Table: scenes (6 columns)
ALTER TABLE scenes RENAME COLUMN "cyclePhase" TO cycle_phase;
ALTER TABLE scenes RENAME COLUMN "emotionalBeat" TO emotional_beat;
ALTER TABLE scenes RENAME COLUMN "characterFocus" TO character_focus;
ALTER TABLE scenes RENAME COLUMN "sensoryAnchors" TO sensory_anchors;
ALTER TABLE scenes RENAME COLUMN "dialogueVsDescription" TO dialogue_vs_description;
ALTER TABLE scenes RENAME COLUMN "suggestedLength" TO suggested_length;

-- Table: characters (5 columns)
ALTER TABLE characters RENAME COLUMN "coreTrait" TO core_trait;
ALTER TABLE characters RENAME COLUMN "internalFlaw" TO internal_flaw;
ALTER TABLE characters RENAME COLUMN "externalGoal" TO external_goal;
ALTER TABLE characters RENAME COLUMN "voiceStyle" TO voice_style;
ALTER TABLE characters RENAME COLUMN "visualStyle" TO visual_style;

-- Table: settings (4 columns)
ALTER TABLE settings RENAME COLUMN "adversityElements" TO adversity_elements;
ALTER TABLE settings RENAME COLUMN "symbolicMeaning" TO symbolic_meaning;
ALTER TABLE settings RENAME COLUMN "cycleAmplification" TO cycle_amplification;
ALTER TABLE settings RENAME COLUMN "emotionalResonance" TO emotional_resonance;

-- Total: 39 columns renamed across 7 tables
-- All database columns now use snake_case (PostgreSQL standard)
-- TypeScript code will continue using camelCase via Drizzle automatic mapping
