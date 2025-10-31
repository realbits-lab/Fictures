-- Fix column name inconsistency: rename moralFramework to moral_framework
-- to match snake_case convention of other columns

ALTER TABLE stories RENAME COLUMN "moralFramework" TO moral_framework;
