import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stories, parts, chapters, scenes, characters, settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import JSZip from 'jszip';
import { authenticateRequest, hasRequiredScope } from '@/lib/auth/dual-auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const { id: storyId } = params;

  try {
    // Check authentication (supports both session and API key)
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has permission to read stories
    if (!hasRequiredScope(authResult, 'stories:read')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Required scope: stories:read' },
        { status: 403 }
      );
    }
    // Fetch all story data
    const [story] = await db
      .select()
      .from(stories)
      .where(eq(stories.id, storyId))
      .limit(1);

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Check if user has access to this story (owner or published)
    if (story.authorId !== authResult.user.id && story.status !== 'published') {
      return NextResponse.json(
        { error: 'You do not have access to this story' },
        { status: 403 }
      );
    }

    // Fetch all related data
    const [storyParts, storyChapters, storyScenes, storyCharacters, storySettings] = await Promise.all([
      db.select().from(parts).where(eq(parts.storyId, storyId)),
      db.select().from(chapters).where(eq(chapters.storyId, storyId)),
      db.select().from(scenes).where(eq(scenes.chapterId, storyId)), // Will need to join properly
      db.select().from(characters).where(eq(characters.storyId, storyId)),
      db.select().from(settings).where(eq(settings.storyId, storyId)),
    ]);

    // Get all scenes for all chapters
    const chapterIds = storyChapters.map(c => c.id);
    const allScenes = await Promise.all(
      chapterIds.map(chapterId =>
        db.select().from(scenes).where(eq(scenes.chapterId, chapterId))
      )
    );
    const flatScenes = allScenes.flat();

    // Create ZIP file
    const zip = new JSZip();

    // Add story metadata
    const storyMetadata = {
      id: story.id,
      title: story.title,
      description: story.description,
      genre: story.genre,
      status: story.status,
      tags: story.tags,
      premise: story.premise,
      dramaticQuestion: story.dramaticQuestion,
      theme: story.theme,
      targetWordCount: story.targetWordCount,
      currentWordCount: story.currentWordCount,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
    };

    zip.file('story_metadata.json', JSON.stringify(storyMetadata, null, 2));

    // Add HNS data files
    if (story.hnsData) {
      zip.file('hns_data/story_hns.json', JSON.stringify(story.hnsData, null, 2));
    }

    // Create markdown file with all content
    let markdown = `# ${story.title}\n\n`;

    if (story.description) {
      markdown += `## Description\n\n${story.description}\n\n`;
    }

    if (story.premise) {
      markdown += `## Premise\n\n${story.premise}\n\n`;
    }

    if (story.dramaticQuestion) {
      markdown += `## Dramatic Question\n\n${story.dramaticQuestion}\n\n`;
    }

    if (story.theme) {
      markdown += `## Theme\n\n${story.theme}\n\n`;
    }

    markdown += `---\n\n`;

    // Sort parts, chapters, and scenes by orderIndex
    const sortedParts = [...storyParts].sort((a, b) => a.orderIndex - b.orderIndex);
    const sortedChapters = [...storyChapters].sort((a, b) => a.orderIndex - b.orderIndex);

    // Add parts and chapters to markdown
    if (sortedParts.length > 0) {
      // Story has parts structure
      // Use 1-based indices for display and file names
      sortedParts.forEach((part, partIndex) => {
        const partNum = partIndex + 1;
        markdown += `# Part ${partNum}: ${part.title}\n\n`;

        if (part.description) {
          markdown += `${part.description}\n\n`;
        }

        // Add part HNS data
        if (part.hnsData) {
          zip.file(`hns_data/parts/part_${partNum}_hns.json`, JSON.stringify(part.hnsData, null, 2));
        }

        // Get chapters for this part
        const partChapters = sortedChapters.filter(c => c.partId === part.id);

        partChapters.forEach((chapter, chapterIndex) => {
          const chapterNum = chapterIndex + 1;
          markdown += `## Chapter ${chapterNum}: ${chapter.title}\n\n`;

          if (chapter.summary) {
            markdown += `**Summary:** ${chapter.summary}\n\n`;
          }

          // Add chapter HNS data
          if (chapter.hnsData) {
            zip.file(
              `hns_data/chapters/part_${partNum}_chapter_${chapterNum}_hns.json`,
              JSON.stringify(chapter.hnsData, null, 2)
            );
          }

          // Get scenes for this chapter
          const chapterScenes = flatScenes
            .filter(s => s.chapterId === chapter.id)
            .sort((a, b) => a.orderIndex - b.orderIndex);

          chapterScenes.forEach((scene, sceneIndex) => {
            const sceneNum = sceneIndex + 1;
            markdown += `### Scene ${sceneNum}: ${scene.title}\n\n`;

            if (scene.content) {
              markdown += `${scene.content}\n\n`;
            }

            // Add scene HNS data
            if (scene.hnsData) {
              zip.file(
                `hns_data/scenes/part_${partNum}_chapter_${chapterNum}_scene_${sceneNum}_hns.json`,
                JSON.stringify(scene.hnsData, null, 2)
              );
            }
          });

          markdown += `\n---\n\n`;
        });
      });
    } else {
      // Story has no parts, just chapters
      sortedChapters.forEach((chapter, chapterIndex) => {
        const chapterNum = chapterIndex + 1;
        markdown += `## Chapter ${chapterNum}: ${chapter.title}\n\n`;

        if (chapter.summary) {
          markdown += `**Summary:** ${chapter.summary}\n\n`;
        }

        // Add chapter HNS data
        if (chapter.hnsData) {
          zip.file(
            `hns_data/chapters/chapter_${chapterNum}_hns.json`,
            JSON.stringify(chapter.hnsData, null, 2)
          );
        }

        // Get scenes for this chapter
        const chapterScenes = flatScenes
          .filter(s => s.chapterId === chapter.id)
          .sort((a, b) => a.orderIndex - b.orderIndex);

        chapterScenes.forEach((scene, sceneIndex) => {
          const sceneNum = sceneIndex + 1;
          markdown += `### Scene ${sceneNum}: ${scene.title}\n\n`;

          if (scene.content) {
            markdown += `${scene.content}\n\n`;
          }

          // Add scene HNS data
          if (scene.hnsData) {
            zip.file(
              `hns_data/scenes/chapter_${chapterNum}_scene_${sceneNum}_hns.json`,
              JSON.stringify(scene.hnsData, null, 2)
            );
          }
        });

        markdown += `\n---\n\n`;
      });
    }

    // Add complete story markdown
    zip.file(`${story.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`, markdown);

    // Add characters data and images
    if (storyCharacters.length > 0) {
      const charactersData = storyCharacters.map(c => ({
        id: c.id,
        name: c.name,
        isMain: c.isMain,
        role: c.role,
        archetype: c.archetype,
        summary: c.summary,
        storyline: c.storyline,
        personality: c.personality,
        backstory: c.backstory,
        motivations: c.motivations,
        voice: c.voice,
        physicalDescription: c.physicalDescription,
        imageUrl: c.imageUrl,
        hnsData: c.hnsData,
      }));

      zip.file('characters/characters.json', JSON.stringify(charactersData, null, 2));

      // Download character images
      for (const character of storyCharacters) {
        if (character.imageUrl) {
          try {
            const response = await fetch(character.imageUrl);
            if (response.ok) {
              const imageBuffer = await response.arrayBuffer();
              const fileName = character.name.replace(/[^a-zA-Z0-9]/g, '_');
              const extension = character.imageUrl.split('.').pop()?.split('?')[0] || 'png';
              zip.file(`characters/images/${fileName}.${extension}`, imageBuffer);
            }
          } catch (error) {
            console.error(`Failed to download character image for ${character.name}:`, error);
          }
        }

        // Add individual character HNS data
        if (character.hnsData) {
          const fileName = character.name.replace(/[^a-zA-Z0-9]/g, '_');
          zip.file(`hns_data/characters/${fileName}_hns.json`, JSON.stringify(character.hnsData, null, 2));
        }
      }
    }

    // Add settings data and images
    if (storySettings.length > 0) {
      const settingsData = storySettings.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        mood: s.mood,
        sensory: s.sensory,
        visualStyle: s.visualStyle,
        visualReferences: s.visualReferences,
        colorPalette: s.colorPalette,
        architecturalStyle: s.architecturalStyle,
        imageUrl: s.imageUrl,
      }));

      zip.file('settings/settings.json', JSON.stringify(settingsData, null, 2));

      // Download setting images
      for (const setting of storySettings) {
        if (setting.imageUrl) {
          try {
            const response = await fetch(setting.imageUrl);
            if (response.ok) {
              const imageBuffer = await response.arrayBuffer();
              const fileName = setting.name.replace(/[^a-zA-Z0-9]/g, '_');
              const extension = setting.imageUrl.split('.').pop()?.split('?')[0] || 'png';
              zip.file(`settings/images/${fileName}.${extension}`, imageBuffer);
            }
          } catch (error) {
            console.error(`Failed to download setting image for ${setting.name}:`, error);
          }
        }
      }
    }

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Return ZIP file as download
    const fileName = `${story.title.replace(/[^a-zA-Z0-9]/g, '_')}_${storyId}.zip`;

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Failed to create download package:', error);
    return NextResponse.json(
      { error: 'Failed to create download package', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
