import { eq } from "drizzle-orm";
import JSZip from "jszip";
import { type NextRequest, NextResponse } from "next/server";
import { requireScopes } from "@/lib/auth/middleware";
import { getAuth } from "@/lib/auth/server-context";
import { db } from "@/lib/db";
import {
    chapters,
    characters,
    parts,
    scenes,
    settings,
    stories,
} from "@/lib/schemas/database";

export const GET = requireScopes("stories:read")(
    async (
        _request: NextRequest,
        context: { params: Promise<{ id: string }> },
    ) => {
        const params = await context.params;
        const { id: storyId } = params;

        try {
            const auth = getAuth();

            // Fetch all story data
            const [story] = await db
                .select()
                .from(stories)
                .where(eq(stories.id, storyId))
                .limit(1);

            if (!story) {
                return NextResponse.json(
                    { error: "Story not found" },
                    { status: 404 },
                );
            }

            // Check if user has access to this story (owner or published)
            if (
                story.authorId !== auth.userId &&
                story.status !== "published"
            ) {
                return NextResponse.json(
                    { error: "You do not have access to this story" },
                    { status: 403 },
                );
            }

            // Fetch all related data
            const [
                storyParts,
                storyChapters,
                _storyScenes,
                storyCharacters,
                storySettings,
            ] = await Promise.all([
                db.select().from(parts).where(eq(parts.storyId, storyId)),
                db.select().from(chapters).where(eq(chapters.storyId, storyId)),
                db
                    .select()
                    .from(scenes)
                    .where(eq(scenes.chapterId, storyId)), // Will need to join properly
                db
                    .select()
                    .from(characters)
                    .where(eq(characters.storyId, storyId)),
                db.select().from(settings).where(eq(settings.storyId, storyId)),
            ]);

            // Get all scenes for all chapters
            const chapterIds = storyChapters.map((c) => c.id);
            const allScenes = await Promise.all(
                chapterIds.map((chapterId) =>
                    db
                        .select()
                        .from(scenes)
                        .where(eq(scenes.chapterId, chapterId)),
                ),
            );
            const flatScenes = allScenes.flat();

            // Create ZIP file
            const zip = new JSZip();

            // Add story metadata
            const storyMetadata = {
                id: story.id,
                title: story.title,
                genre: story.genre,
                status: story.status,
                summary: story.summary,
                tone: story.tone,
                moralFramework: story.moralFramework,
                createdAt: story.createdAt,
                updatedAt: story.updatedAt,
            };

            zip.file(
                "story_metadata.json",
                JSON.stringify(storyMetadata, null, 2),
            );

            // Add HNS data files
            if ((story as any).hnsData) {
                zip.file(
                    "hns_data/story_hns.json",
                    JSON.stringify((story as any).hnsData, null, 2),
                );
            }

            // Create HTML file with all content
            let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${story.title}</title>
  <style>
    body {
      font-family: 'Georgia', serif;
      line-height: 1.8;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #f5f5f5;
      color: #333;
    }
    .story-container {
      background: white;
      padding: 60px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      border-radius: 8px;
    }
    h1 {
      font-size: 2.5em;
      color: #1a1a1a;
      margin-bottom: 30px;
      border-bottom: 3px solid #333;
      padding-bottom: 20px;
    }
    h2 {
      font-size: 2em;
      color: #2a2a2a;
      margin-top: 50px;
      margin-bottom: 20px;
      border-left: 5px solid #666;
      padding-left: 20px;
    }
    h3 {
      font-size: 1.5em;
      color: #3a3a3a;
      margin-top: 40px;
      margin-bottom: 15px;
    }
    h4 {
      font-size: 1.2em;
      color: #4a4a4a;
      margin-top: 30px;
      margin-bottom: 10px;
      font-style: italic;
    }
    .metadata {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 5px;
      margin-bottom: 40px;
      border-left: 4px solid #333;
    }
    .metadata h2 {
      margin-top: 0;
      font-size: 1.3em;
      border-left: none;
      padding-left: 0;
    }
    .metadata p {
      margin: 10px 0;
    }
    .part {
      margin-top: 60px;
      page-break-before: always;
    }
    .chapter {
      margin-top: 50px;
    }
    .scene {
      margin-top: 40px;
    }
    .scene-image {
      width: 100%;
      max-width: 100%;
      height: auto;
      margin: 30px 0;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    .summary {
      font-style: italic;
      color: #555;
      margin-bottom: 20px;
      padding: 15px;
      background: #f0f0f0;
      border-radius: 5px;
    }
    .divider {
      border: 0;
      height: 2px;
      background: linear-gradient(to right, transparent, #ccc, transparent);
      margin: 50px 0;
    }
    p {
      margin-bottom: 1.2em;
      text-align: justify;
    }
    .reference-section {
      margin-top: 60px;
      page-break-before: always;
    }
    .reference-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
      margin-top: 30px;
    }
    .reference-item {
      background: #f9f9f9;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .reference-image {
      width: 100%;
      height: 300px;
      object-fit: cover;
    }
    .reference-title {
      padding: 20px;
      font-size: 1.2em;
      font-weight: bold;
      text-align: center;
      background: white;
    }
    @media print {
      body {
        background: white;
      }
      .story-container {
        box-shadow: none;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="story-container">
    <h1>${story.title}</h1>

    <div class="metadata">`;

            if (story.summary) {
                html += `
      <h2>Description</h2>
      <p>${story.summary}</p>`;
            }

            if ((story as any).premise) {
                html += `
      <h2>Premise</h2>
      <p>${(story as any).premise}</p>`;
            }

            if ((story as any).dramaticQuestion) {
                html += `
      <h2>Dramatic Question</h2>
      <p>${(story as any).dramaticQuestion}</p>`;
            }

            if ((story as any).theme) {
                html += `
      <h2>Theme</h2>
      <p>${(story as any).theme}</p>`;
            }

            html += `
    </div>
    <hr class="divider">`;

            // Sort parts, chapters, and scenes by orderIndex
            const sortedParts = [...storyParts].sort(
                (a, b) => a.orderIndex - b.orderIndex,
            );
            const sortedChapters = [...storyChapters].sort(
                (a, b) => a.orderIndex - b.orderIndex,
            );

            // Helper function to convert text content to HTML paragraphs
            const formatContent = (content: string) => {
                if (!content) return "";
                return content
                    .split("\n\n")
                    .filter((p) => p.trim())
                    .map((p) => `<p>${p.trim()}</p>`)
                    .join("\n");
            };

            // Add parts and chapters to HTML
            if (sortedParts.length > 0) {
                // Story has parts structure
                // Use 1-based indices for display and file names
                sortedParts.forEach((part, partIndex) => {
                    const partNum = partIndex + 1;
                    html += `
    <div class="part">
      <h2>Part ${partNum}: ${part.title}</h2>`;

                    if (part.summary) {
                        html += `
      <div class="summary">${part.summary}</div>`;
                    }

                    // Add part HNS data
                    if ((part as any).hnsData) {
                        zip.file(
                            `hns_data/parts/part_${partNum}_hns.json`,
                            JSON.stringify((part as any).hnsData, null, 2),
                        );
                    }

                    // Get chapters for this part
                    const partChapters = sortedChapters.filter(
                        (c) => c.partId === part.id,
                    );

                    partChapters.forEach((chapter, chapterIndex) => {
                        const chapterNum = chapterIndex + 1;
                        html += `
      <div class="chapter">
        <h3>Chapter ${chapterNum}: ${chapter.title}</h3>`;

                        if (chapter.summary) {
                            html += `
        <div class="summary">${chapter.summary}</div>`;
                        }

                        // Add chapter HNS data
                        if ((chapter as any).hnsData) {
                            zip.file(
                                `hns_data/chapters/part_${partNum}_chapter_${chapterNum}_hns.json`,
                                JSON.stringify(
                                    (chapter as any).hnsData,
                                    null,
                                    2,
                                ),
                            );
                        }

                        // Get scenes for this chapter
                        const chapterScenes = flatScenes
                            .filter((s) => s.chapterId === chapter.id)
                            .sort((a, b) => a.orderIndex - b.orderIndex);

                        chapterScenes.forEach((scene, sceneIndex) => {
                            const sceneNum = sceneIndex + 1;
                            html += `
        <div class="scene">
          <h4>Scene ${sceneNum}: ${scene.title}</h4>`;

                            // Add scene image if available
                            if (
                                (scene as any).hnsData &&
                                typeof (scene as any).hnsData === "object" &&
                                "scene_image" in (scene as any).hnsData
                            ) {
                                const sceneImage = (
                                    (scene as any).hnsData as any
                                ).scene_image;
                                if (sceneImage?.url) {
                                    html += `
          <img src="${sceneImage.url}" alt="Scene ${sceneNum}: ${scene.title}" class="scene-image" />`;
                                }
                            }

                            if (scene.content) {
                                html += `
          ${formatContent(scene.content)}`;
                            }

                            // Add scene HNS data
                            if ((scene as any).hnsData) {
                                zip.file(
                                    `hns_data/scenes/part_${partNum}_chapter_${chapterNum}_scene_${sceneNum}_hns.json`,
                                    JSON.stringify(
                                        (scene as any).hnsData,
                                        null,
                                        2,
                                    ),
                                );
                            }

                            html += `
        </div>`;
                        });

                        html += `
        <hr class="divider">
      </div>`;
                    });

                    html += `
    </div>`;
                });
            } else {
                // Story has no parts, just chapters
                sortedChapters.forEach((chapter, chapterIndex) => {
                    const chapterNum = chapterIndex + 1;
                    html += `
    <div class="chapter">
      <h2>Chapter ${chapterNum}: ${chapter.title}</h2>`;

                    if (chapter.summary) {
                        html += `
      <div class="summary">${chapter.summary}</div>`;
                    }

                    // Add chapter HNS data
                    if ((chapter as any).hnsData) {
                        zip.file(
                            `hns_data/chapters/chapter_${chapterNum}_hns.json`,
                            JSON.stringify((chapter as any).hnsData, null, 2),
                        );
                    }

                    // Get scenes for this chapter
                    const chapterScenes = flatScenes
                        .filter((s) => s.chapterId === chapter.id)
                        .sort((a, b) => a.orderIndex - b.orderIndex);

                    chapterScenes.forEach((scene, sceneIndex) => {
                        const sceneNum = sceneIndex + 1;
                        html += `
      <div class="scene">
        <h4>Scene ${sceneNum}: ${scene.title}</h4>`;

                        // Add scene image if available
                        if (
                            (scene as any).hnsData &&
                            typeof (scene as any).hnsData === "object" &&
                            "scene_image" in (scene as any).hnsData
                        ) {
                            const sceneImage = ((scene as any).hnsData as any)
                                .scene_image;
                            if (sceneImage?.url) {
                                html += `
        <img src="${sceneImage.url}" alt="Scene ${sceneNum}: ${scene.title}" class="scene-image" />`;
                            }
                        }

                        if (scene.content) {
                            html += `
        ${formatContent(scene.content)}`;
                        }

                        // Add scene HNS data
                        if ((scene as any).hnsData) {
                            zip.file(
                                `hns_data/scenes/chapter_${chapterNum}_scene_${sceneNum}_hns.json`,
                                JSON.stringify((scene as any).hnsData, null, 2),
                            );
                        }

                        html += `
      </div>`;
                    });

                    html += `
      <hr class="divider">
    </div>`;
                });
            }

            // Add Characters section
            if (storyCharacters.length > 0) {
                html += `
    <div class="reference-section">
      <h2>Characters</h2>
      <div class="reference-grid">`;

                storyCharacters.forEach((character) => {
                    if (character.imageUrl) {
                        html += `
        <div class="reference-item">
          <img src="${character.imageUrl}" alt="${character.name}" class="reference-image" />
          <div class="reference-title">${character.name}</div>
        </div>`;
                    }
                });

                html += `
      </div>
    </div>`;
            }

            // Add Settings section
            if (storySettings.length > 0) {
                html += `
    <div class="reference-section">
      <h2>Settings</h2>
      <div class="reference-grid">`;

                storySettings.forEach((setting) => {
                    if (setting.imageUrl) {
                        html += `
        <div class="reference-item">
          <img src="${setting.imageUrl}" alt="${setting.name}" class="reference-image" />
          <div class="reference-title">${setting.name}</div>
        </div>`;
                    }
                });

                html += `
      </div>
    </div>`;
            }

            // Close HTML document
            html += `
  </div>
</body>
</html>`;

            // Add complete story HTML file
            zip.file(`${story.title.replace(/[^a-zA-Z0-9]/g, "_")}.html`, html);

            // Add characters data and images
            if (storyCharacters.length > 0) {
                const charactersData = storyCharacters.map((c) => ({
                    id: c.id,
                    name: c.name,
                    isMain: c.isMain,
                    role: (c as any).role,
                    archetype: (c as any).archetype,
                    summary: c.summary,
                    storyline: (c as any).storyline,
                    personality: c.personality,
                    backstory: c.backstory,
                    motivations: (c as any).motivations,
                    voice: (c as any).voice,
                    physicalDescription: c.physicalDescription,
                    imageUrl: c.imageUrl,
                    hnsData: (c as any).hnsData,
                }));

                zip.file(
                    "characters/characters.json",
                    JSON.stringify(charactersData, null, 2),
                );

                // Download character images
                for (const character of storyCharacters) {
                    if (character.imageUrl) {
                        try {
                            const response = await fetch(character.imageUrl);
                            if (response.ok) {
                                const imageBuffer =
                                    await response.arrayBuffer();
                                const fileName = character.name.replace(
                                    /[^a-zA-Z0-9]/g,
                                    "_",
                                );
                                const extension =
                                    character.imageUrl
                                        .split(".")
                                        .pop()
                                        ?.split("?")[0] || "png";
                                zip.file(
                                    `characters/images/${fileName}.${extension}`,
                                    imageBuffer,
                                );
                            }
                        } catch (error) {
                            console.error(
                                `Failed to download character image for ${character.name}:`,
                                error,
                            );
                        }
                    }

                    // Add individual character HNS data
                    if ((character as any).hnsData) {
                        const fileName = character.name.replace(
                            /[^a-zA-Z0-9]/g,
                            "_",
                        );
                        zip.file(
                            `hns_data/characters/${fileName}_hns.json`,
                            JSON.stringify((character as any).hnsData, null, 2),
                        );
                    }
                }
            }

            // Add settings data and images
            if (storySettings.length > 0) {
                const settingsData = storySettings.map((s) => ({
                    id: s.id,
                    name: s.name,
                    summary: s.summary,
                    mood: s.mood,
                    sensory: s.sensory,
                    visualReferences: s.visualReferences,
                    colorPalette: s.colorPalette,
                    architecturalStyle: s.architecturalStyle,
                    imageUrl: s.imageUrl,
                }));

                zip.file(
                    "settings/settings.json",
                    JSON.stringify(settingsData, null, 2),
                );

                // Download setting images
                for (const setting of storySettings) {
                    if (setting.imageUrl) {
                        try {
                            const response = await fetch(setting.imageUrl);
                            if (response.ok) {
                                const imageBuffer =
                                    await response.arrayBuffer();
                                const fileName = setting.name.replace(
                                    /[^a-zA-Z0-9]/g,
                                    "_",
                                );
                                const extension =
                                    setting.imageUrl
                                        .split(".")
                                        .pop()
                                        ?.split("?")[0] || "png";
                                zip.file(
                                    `settings/images/${fileName}.${extension}`,
                                    imageBuffer,
                                );
                            }
                        } catch (error) {
                            console.error(
                                `Failed to download setting image for ${setting.name}:`,
                                error,
                            );
                        }
                    }
                }
            }

            // Generate ZIP file
            const zipBuffer = await zip.generateAsync({
                type: "nodebuffer",
            });

            // Return ZIP file as download
            const fileName = `${story.title.replace(/[^a-zA-Z0-9]/g, "_")}_${storyId}.zip`;

            // Convert Buffer to Uint8Array for NextResponse
            return new NextResponse(new Uint8Array(zipBuffer), {
                headers: {
                    "Content-Type": "application/zip",
                    "Content-Disposition": `attachment; filename="${fileName}"`,
                },
            });
        } catch (error) {
            console.error("Failed to create download package:", error);
            return NextResponse.json(
                {
                    error: "Failed to create download package",
                    details:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                { status: 500 },
            );
        }
    },
);
