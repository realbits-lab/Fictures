/**
 * Novel Generation Streaming API
 *
 * Unified endpoint for complete novel generation using the Adversity-Triumph Engine.
 * Replaces the legacy HNS generation system.
 *
 * This endpoint:
 * 1. Orchestrates all 9 novel generation phases
 * 2. Streams progress updates via Server-Sent Events (SSE)
 * 3. Creates database records for story, characters, settings, parts, chapters, scenes
 * 4. Generates and optimizes images for all visual elements
 *
 * Usage:
 *   POST /studio/api/novels/generate
 *   Body: { userPrompt, preferredGenre?, preferredTone?, characterCount?, language? }
 *   Returns: SSE stream with progress updates
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { stories, parts, chapters, scenes, characters, settings } from '@/lib/db/schema';
import { generateCompleteNovel, type NovelGenerationOptions, type ProgressData } from '@/lib/novels/orchestrator';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

function createSSEMessage(data: ProgressData): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json() as NovelGenerationOptions;
    const { userPrompt, preferredGenre, preferredTone, characterCount, settingCount, partsCount, chaptersPerPart, scenesPerChapter, language } = body;

    if (!userPrompt?.trim()) {
      return new Response('User prompt is required', { status: 400 });
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let generatedStoryId: string | null = null;
          let generatedStory: any = null;
          let generatedCharacters: any[] = [];
          let generatedSettings: any[] = [];
          let generatedParts: any[] = [];
          let generatedChapters: any[] = [];
          let generatedScenes: any[] = [];

          // Progress callback to stream updates
          const onProgress = async (progress: ProgressData) => {
            controller.enqueue(encoder.encode(createSSEMessage(progress)));

            // Store data for database insertion
            if (progress.phase === 'story_summary_complete') {
              generatedStory = progress.data?.storySummary;
            } else if (progress.phase === 'characters_complete') {
              generatedCharacters = progress.data?.characters || [];
            } else if (progress.phase === 'settings_complete') {
              generatedSettings = progress.data?.settings || [];
            } else if (progress.phase === 'parts_complete') {
              generatedParts = progress.data?.parts || [];
            } else if (progress.phase === 'chapters_complete') {
              generatedChapters = progress.data?.chapters || [];
            } else if (progress.phase === 'scene_summaries_complete') {
              // Scene summaries are integrated into scenes
            } else if (progress.phase === 'scene_content_complete') {
              // Will be handled after complete generation
            }
          };

          // Generate the complete novel
          const result = await generateCompleteNovel(
            {
              userPrompt,
              preferredGenre,
              preferredTone,
              characterCount,
              settingCount,
              partsCount,
              chaptersPerPart,
              scenesPerChapter,
              language,
            },
            onProgress
          );

          // Create database records
          controller.enqueue(
            encoder.encode(
              createSSEMessage({
                phase: 'scene_content_progress',
                message: 'Saving story to database...',
              })
            )
          );

          // Insert story
          generatedStoryId = nanoid();
          const [storyRecord] = await db
            .insert(stories)
            .values({
              id: generatedStoryId,
              userId: session.user.id,
              title: result.story.title,
              genre: result.story.genre,
              tone: result.story.tone,
              summary: result.story.summary,
              moralFramework: result.story.moralFramework,
              status: 'draft',
              visibility: 'private',
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();

          // Insert characters
          if (result.characters.length > 0) {
            const characterRecords = result.characters.map((char) => ({
              id: nanoid(),
              storyId: generatedStoryId!,
              name: char.name,
              isMain: char.isMain,
              summary: char.summary,
              coreTrait: char.coreTrait,
              internalFlaw: char.internalFlaw,
              externalGoal: char.externalGoal,
              personality: char.personality,
              backstory: char.backstory,
              relationships: char.relationships,
              physicalDescription: char.physicalDescription,
              voiceStyle: char.voiceStyle,
              visualStyle: char.visualStyle,
              createdAt: new Date(),
              updatedAt: new Date(),
            }));

            await db.insert(characters).values(characterRecords);
          }

          // Insert settings
          if (result.settings.length > 0) {
            const settingRecords = result.settings.map((setting) => ({
              id: nanoid(),
              storyId: generatedStoryId!,
              name: setting.name,
              description: setting.description,
              adversityElements: setting.adversityElements,
              symbolicMeaning: setting.symbolicMeaning,
              cycleAmplification: setting.cycleAmplification,
              mood: setting.mood,
              emotionalResonance: setting.emotionalResonance,
              sensory: setting.sensory,
              architecturalStyle: setting.architecturalStyle,
              visualStyle: setting.visualStyle,
              visualReferences: setting.visualReferences,
              colorPalette: setting.colorPalette,
              createdAt: new Date(),
              updatedAt: new Date(),
            }));

            await db.insert(settings).values(settingRecords);
          }

          // Insert parts
          if (result.parts.length > 0) {
            const partRecords = result.parts.map((part, index) => ({
              id: nanoid(),
              storyId: generatedStoryId!,
              title: part.title,
              summary: part.summary,
              actNumber: part.actNumber,
              characterArcs: part.characterArcs,
              orderIndex: index,
              createdAt: new Date(),
              updatedAt: new Date(),
            }));

            await db.insert(parts).values(partRecords);
          }

          // Insert chapters
          if (result.chapters.length > 0) {
            const chapterRecords = result.chapters.map((chapter, index) => ({
              id: nanoid(),
              storyId: generatedStoryId!,
              partId: null, // Will be linked later if needed
              title: chapter.title,
              summary: chapter.summary,
              characterId: chapter.characterId,
              arcPosition: chapter.arcPosition,
              contributesToMacroArc: chapter.contributesToMacroArc,
              focusCharacters: chapter.focusCharacters,
              adversityType: chapter.adversityType,
              virtueType: chapter.virtueType,
              seedsPlanted: chapter.seedsPlanted,
              seedsResolved: chapter.seedsResolved,
              connectsToPreviousChapter: chapter.connectsToPreviousChapter,
              createsNextAdversity: chapter.createsNextAdversity,
              orderIndex: index,
              createdAt: new Date(),
              updatedAt: new Date(),
            }));

            await db.insert(chapters).values(chapterRecords);
          }

          // Insert scenes
          if (result.scenes.length > 0) {
            const sceneRecords = result.scenes.map((scene, index) => ({
              id: nanoid(),
              chapterId: null, // Will be linked later if needed
              storyId: generatedStoryId!,
              title: scene.title,
              summary: scene.summary,
              content: scene.content,
              cyclePhase: scene.cyclePhase,
              emotionalBeat: scene.emotionalBeat,
              orderIndex: index,
              createdAt: new Date(),
              updatedAt: new Date(),
            }));

            await db.insert(scenes).values(sceneRecords);
          }

          // Send completion message
          controller.enqueue(
            encoder.encode(
              createSSEMessage({
                phase: 'complete',
                message: 'Story generation complete!',
                data: {
                  storyId: generatedStoryId,
                  story: storyRecord,
                  charactersCount: result.characters.length,
                  settingsCount: result.settings.length,
                  partsCount: result.parts.length,
                  chaptersCount: result.chapters.length,
                  scenesCount: result.scenes.length,
                },
              })
            )
          );

          controller.close();
        } catch (error) {
          console.error('Novel generation error:', error);

          controller.enqueue(
            encoder.encode(
              createSSEMessage({
                phase: 'error',
                message: error instanceof Error ? error.message : 'Unknown error',
                error: error instanceof Error ? error.message : String(error),
              })
            )
          );

          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Novel generation request error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to start novel generation',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
