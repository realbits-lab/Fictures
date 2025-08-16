/**
 * GREEN PHASE - Migration Validator Implementation
 * Validates data integrity before and after migration
 */

import { DrizzleD1Database } from 'drizzle-orm/d1';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, isNull, isNotNull, count, sql } from 'drizzle-orm';
import { 
  book, 
  chapter, 
  chapterEnhanced, 
  story, 
  part, 
  scene 
} from '../db/schema';

export interface ValidationResult {
  isValid: boolean;
  dataIntegrityChecks: {
    missingReferences: number;
    duplicateEntries: number;
    wordCountMismatches: number;
  };
  migrationIntegrityChecks: {
    unmappedChapters: number;
    orphanedScenes: number;
    incorrectHierarchy: number;
  };
  warnings: string[];
  errors: string[];
  validatedItems?: number;
}

export class MigrationValidator {
  private db: PostgresJsDatabase<any> | DrizzleD1Database<any>;

  constructor(database: PostgresJsDatabase<any> | DrizzleD1Database<any>) {
    this.db = database;
  }

  async validateBeforeMigration(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      dataIntegrityChecks: {
        missingReferences: 0,
        duplicateEntries: 0,
        wordCountMismatches: 0
      },
      migrationIntegrityChecks: {
        unmappedChapters: 0,
        orphanedScenes: 0,
        incorrectHierarchy: 0
      },
      warnings: [],
      errors: []
    };

    try {
      // Check for existing hierarchy data that might conflict
      const existingStories = await this.db.select().from(story);
      if (existingStories.length > 0) {
        result.warnings.push('Existing hierarchy data detected');
      }

      // Check for books without authors
      const booksWithoutAuthors = await this.db
        .select()
        .from(book)
        .where(isNull(book.authorId));
      
      if (booksWithoutAuthors.length > 0) {
        result.errors.push(`Found ${booksWithoutAuthors.length} books without authors`);
        result.dataIntegrityChecks.missingReferences += booksWithoutAuthors.length;
        result.isValid = false;
      }

      // Check for chapters with invalid book references
      const chaptersWithInvalidBooks = await this.db
        .select({ 
          chapterId: chapter.id,
          bookId: chapter.bookId 
        })
        .from(chapter)
        .leftJoin(book, eq(chapter.bookId, book.id))
        .where(isNull(book.id));

      if (chaptersWithInvalidBooks.length > 0) {
        result.errors.push(`Found ${chaptersWithInvalidBooks.length} chapters with invalid book references`);
        result.dataIntegrityChecks.missingReferences += chaptersWithInvalidBooks.length;
        result.isValid = false;
      }

      // Check for duplicate chapter numbers within books
      const duplicateChapters = await this.db
        .select({
          bookId: chapter.bookId,
          chapterNumber: chapter.chapterNumber,
          count: count()
        })
        .from(chapter)
        .groupBy(chapter.bookId, chapter.chapterNumber)
        .having(sql`count(*) > 1`);

      if (duplicateChapters.length > 0) {
        result.errors.push(`Found ${duplicateChapters.length} duplicate chapter numbers`);
        result.dataIntegrityChecks.duplicateEntries += duplicateChapters.length;
        result.isValid = false;
      }

      // Check for invalid word counts
      const chaptersWithInvalidWordCounts = await this.db
        .select()
        .from(chapter)
        .where(sql`${chapter.wordCount} < 0`);

      if (chaptersWithInvalidWordCounts.length > 0) {
        result.errors.push(`Found ${chaptersWithInvalidWordCounts.length} chapters with invalid word counts`);
        result.dataIntegrityChecks.wordCountMismatches += chaptersWithInvalidWordCounts.length;
        result.isValid = false;
      }

      // Check for chapters with empty titles
      const chaptersWithEmptyTitles = await this.db
        .select()
        .from(chapter)
        .where(sql`${chapter.title} = '' OR ${chapter.title} IS NULL`);

      if (chaptersWithEmptyTitles.length > 0) {
        result.warnings.push(`Found ${chaptersWithEmptyTitles.length} chapters with empty titles`);
      }

      // Check for books with empty titles
      const booksWithEmptyTitles = await this.db
        .select()
        .from(book)
        .where(sql`${book.title} = '' OR ${book.title} IS NULL`);

      if (booksWithEmptyTitles.length > 0) {
        result.errors.push(`Found ${booksWithEmptyTitles.length} books with empty titles`);
        result.isValid = false;
      }

    } catch (error) {
      result.errors.push(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
      result.isValid = false;
    }

    return result;
  }

  async validateAfterMigration(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      dataIntegrityChecks: {
        missingReferences: 0,
        duplicateEntries: 0,
        wordCountMismatches: 0
      },
      migrationIntegrityChecks: {
        unmappedChapters: 0,
        orphanedScenes: 0,
        incorrectHierarchy: 0
      },
      warnings: [],
      errors: []
    };

    try {
      // Check for orphaned scenes (scenes without valid chapters)
      const orphanedScenes = await this.db
        .select({ sceneId: scene.id })
        .from(scene)
        .leftJoin(chapterEnhanced, eq(scene.chapterId, chapterEnhanced.id))
        .where(isNull(chapterEnhanced.id));

      result.migrationIntegrityChecks.orphanedScenes = orphanedScenes.length;
      if (orphanedScenes.length > 0) {
        result.errors.push(`Found ${orphanedScenes.length} orphaned scenes`);
        result.isValid = false;
      }

      // Check for chapters without parts
      const chaptersWithoutParts = await this.db
        .select({ chapterId: chapterEnhanced.id })
        .from(chapterEnhanced)
        .leftJoin(part, eq(chapterEnhanced.partId, part.id))
        .where(isNull(part.id));

      if (chaptersWithoutParts.length > 0) {
        result.errors.push(`Found ${chaptersWithoutParts.length} chapters without parts`);
        result.migrationIntegrityChecks.incorrectHierarchy += chaptersWithoutParts.length;
        result.isValid = false;
      }

      // Check for parts without stories
      const partsWithoutStories = await this.db
        .select({ partId: part.id })
        .from(part)
        .leftJoin(story, eq(part.storyId, story.id))
        .where(isNull(story.id));

      if (partsWithoutStories.length > 0) {
        result.errors.push(`Found ${partsWithoutStories.length} parts without stories`);
        result.migrationIntegrityChecks.incorrectHierarchy += partsWithoutStories.length;
        result.isValid = false;
      }

      // Check for stories without books
      const storiesWithoutBooks = await this.db
        .select({ storyId: story.id })
        .from(story)
        .leftJoin(book, eq(story.bookId, book.id))
        .where(isNull(book.id));

      if (storiesWithoutBooks.length > 0) {
        result.errors.push(`Found ${storiesWithoutBooks.length} stories without books`);
        result.migrationIntegrityChecks.incorrectHierarchy += storiesWithoutBooks.length;
        result.isValid = false;
      }

      // Check for unmapped original chapters
      const originalChapters = await this.db.select().from(chapter);
      const enhancedChapters = await this.db.select().from(chapterEnhanced);
      
      // Simple check: should have same number of chapters after migration
      if (originalChapters.length !== enhancedChapters.length) {
        result.migrationIntegrityChecks.unmappedChapters = Math.abs(originalChapters.length - enhancedChapters.length);
        result.errors.push(`Chapter count mismatch: ${originalChapters.length} original vs ${enhancedChapters.length} enhanced`);
        result.isValid = false;
      }

      // Validate word count consistency across hierarchy
      await this.validateWordCountConsistency(result);

      // Set validated items count
      result.validatedItems = originalChapters.length;

    } catch (error) {
      result.errors.push(`Post-migration validation failed: ${error instanceof Error ? error.message : String(error)}`);
      result.isValid = false;
    }

    return result;
  }

  async checkDataIntegrity(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      dataIntegrityChecks: {
        missingReferences: 0,
        duplicateEntries: 0,
        wordCountMismatches: 0
      },
      migrationIntegrityChecks: {
        unmappedChapters: 0,
        orphanedScenes: 0,
        incorrectHierarchy: 0
      },
      warnings: [],
      errors: []
    };

    try {
      // Check word count accuracy across all levels
      const stories = await this.db.select().from(story);
      
      for (const storyData of stories) {
        const parts = await this.db.select().from(part).where(eq(part.storyId, storyData.id));
        let storyWordCount = 0;

        for (const partData of parts) {
          const chapters = await this.db.select().from(chapterEnhanced).where(eq(chapterEnhanced.partId, partData.id));
          let partWordCount = 0;

          for (const chapterData of chapters) {
            const scenes = await this.db.select().from(scene).where(eq(scene.chapterId, chapterData.id));
            const sceneWordCount = scenes.reduce((sum, scene) => sum + (scene.wordCount || 0), 0);

            if (chapterData.wordCount !== sceneWordCount) {
              result.dataIntegrityChecks.wordCountMismatches++;
              result.warnings.push(`Chapter ${chapterData.id} word count mismatch`);
            }

            partWordCount += chapterData.wordCount || 0;
          }

          if (partData.wordCount !== partWordCount) {
            result.dataIntegrityChecks.wordCountMismatches++;
            result.warnings.push(`Part ${partData.id} word count mismatch`);
          }

          storyWordCount += partData.wordCount || 0;
        }

        if (storyData.wordCount !== storyWordCount) {
          result.dataIntegrityChecks.wordCountMismatches++;
          result.warnings.push(`Story ${storyData.id} word count mismatch`);
        }
      }

      if (result.dataIntegrityChecks.wordCountMismatches > 0) {
        result.isValid = false;
      }

    } catch (error) {
      result.errors.push(`Data integrity check failed: ${error instanceof Error ? error.message : String(error)}`);
      result.isValid = false;
    }

    return result;
  }

  private async validateWordCountConsistency(result: ValidationResult): Promise<void> {
    try {
      // Check that chapter word counts match scene totals
      const chaptersWithScenes = await this.db
        .select({
          chapterId: chapterEnhanced.id,
          chapterWordCount: chapterEnhanced.wordCount,
          sceneWordCount: sql<number>`COALESCE(SUM(${scene.wordCount}), 0)`
        })
        .from(chapterEnhanced)
        .leftJoin(scene, eq(chapterEnhanced.id, scene.chapterId))
        .groupBy(chapterEnhanced.id, chapterEnhanced.wordCount);

      for (const chapterData of chaptersWithScenes) {
        if (chapterData.chapterWordCount !== chapterData.sceneWordCount) {
          result.dataIntegrityChecks.wordCountMismatches++;
        }
      }

      if (result.dataIntegrityChecks.wordCountMismatches > 0) {
        result.warnings.push(`Found ${result.dataIntegrityChecks.wordCountMismatches} word count mismatches`);
      }

    } catch (error) {
      result.warnings.push(`Word count validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}