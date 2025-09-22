/**
 * Scene Content Generator
 * Generates narrative content for individual scenes after structure is complete
 */

import { generateObject } from "ai";
import { z } from "zod";
import { AI_MODELS } from "./config";
import { db } from "@/lib/db";
import { scenes as scenesTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { HNSScene, HNSChapter, HNSCharacter, HNSSetting, HNSStory } from "@/types/hns";

// Schema for scene content generation
const SceneContentSchema = z.object({
  content: z.string().describe("Complete scene narrative content (800-1500 words) - full scene from beginning to end"),
  writing_notes: z.string().optional().describe("Brief notes about the scene's purpose and flow"),
});

/**
 * Post-process scene content to ensure proper dialogue formatting
 * Only fixes dialogue that's NOT already properly formatted with two newlines
 */
function formatDialogueContent(content: string): string {
  let formattedContent = content;

  // Pattern 1: Dialogue immediately followed by narrative text (no double newlines)
  // Example: "Hello," he said. -> "Hello,"\n\nHe said.
  // Only match if dialogue is NOT preceded by \n\n AND NOT followed by \n\n
  const dialogueNarrativePattern = /(?<!\n\n)("([^"]|\\")*?")(\s+)([^"\n][^"]*?[.!?])(?!\n\n)/g;

  formattedContent = formattedContent.replace(dialogueNarrativePattern, (match, dialogue, _, space, narrative) => {
    return `${dialogue}\n\n${narrative.trim()}`;
  });

  // Pattern 2: Narrative followed immediately by dialogue (no double newlines)
  // Example: He nodded. "Yes." -> He nodded.\n\n"Yes."
  // Only match if narrative is NOT followed by \n\n before dialogue
  const narrativeDialoguePattern = /([^"\n][^"]*?[.!?])(\s+)("([^"]|\\")*?")(?!\n\n)/g;

  formattedContent = formattedContent.replace(narrativeDialoguePattern, (match, narrative, space, dialogue) => {
    return `${narrative.trim()}\n\n${dialogue}`;
  });

  // Pattern 3: Two dialogue sentences on same line
  // Example: "Hello." "Goodbye." -> "Hello."\n\n"Goodbye."
  // Only match if first dialogue is NOT followed by \n\n
  const multiDialoguePattern = /("([^"]|\\")*?")(\s+)("([^"]|\\")*?")(?!\n\n)/g;

  formattedContent = formattedContent.replace(multiDialoguePattern, '$1\n\n$4');

  // Pattern 4: Complex dialogue-narrative-dialogue on same line/paragraph
  // Example: "Text," he said. "More text." -> "Text,"\n\nHe said.\n\n"More text."
  // Only if not already properly spaced
  const complexPattern = /(?<!\n\n)("([^"]|\\")*?")(\s+)([^"]*?)(\s+)("([^"]|\\")*?")(?!\n\n)/g;

  formattedContent = formattedContent.replace(complexPattern, (match, dialogue1, _, space1, narrative, space2, dialogue2) => {
    const cleanNarrative = narrative.trim();
    if (cleanNarrative && !cleanNarrative.match(/^[.!?]/)) {
      return `${dialogue1}\n\n${cleanNarrative}\n\n${dialogue2}`;
    } else {
      return `${dialogue1}\n\n${dialogue2}`;
    }
  });

  // Clean up excessive newlines (more than 2) but preserve intentional double newlines
  formattedContent = formattedContent.replace(/\n{3,}/g, '\n\n');

  return formattedContent.trim();
}

/**
 * Generate narrative content for a single scene
 */
export async function generateSceneContent(
  scene: HNSScene,
  chapter: HNSChapter,
  story: HNSStory,
  characters: HNSCharacter[],
  settings: HNSSetting[]
): Promise<{ content: string; writing_notes?: string }> {
  try {
    // Find the POV character and setting for this scene
    const povCharacter = characters.find(c => c.character_id === scene.pov_character_id);
    const setting = settings.find(s => s.setting_id === scene.setting_id);
    const sceneCharacters = characters.filter(c => scene.character_ids?.includes(c.character_id || ''));

    const { object } = await generateObject({
      model: AI_MODELS.writing,
      schema: SceneContentSchema,
      system: `You are a professional web novelist optimizing for mobile reading and maximum engagement. Write the COMPLETE scene following web novel prose discipline.

== STORY CONTEXT ==
Title: ${story.story_title} | Genre: ${story.genre.join(", ")}
Theme: ${story.theme} | Premise: ${story.premise}

== CHAPTER CONTEXT ==
Title: ${chapter.chapter_title} | Pacing Goal: ${chapter.pacing_goal}
Summary: ${chapter.summary}

== SCENE BLUEPRINT ==
Title: ${scene.scene_title}
Entry Hook: ${scene.entry_hook}
Goal: ${scene.goal} | Conflict: ${scene.conflict} | Outcome: ${scene.outcome}
Emotional Arc: ${scene.emotional_shift?.from} → ${scene.emotional_shift?.to}
POV: ${povCharacter?.name || 'Unknown'} (${scene.narrative_voice})

== SETTING ==
${setting?.name}: ${setting?.description} (Mood: ${setting?.mood})
Sensory: ${[setting?.sensory?.sight?.[0], setting?.sensory?.sound?.[0], setting?.sensory?.smell?.[0]].filter(Boolean).join(" | ")}

== CHARACTERS ==
${sceneCharacters.map(c => `${c.name} (${c.role})`).join(" | ")}

== WEB NOVEL WRITING DISCIPLINE ==

CORE PRINCIPLES:
• Mobile-first readability (smartphone screen optimization)
• Zero friction prose (instant comprehension)
• Binge-reading design (addictive forward momentum)

QUANTITATIVE REQUIREMENTS:
• Words per sentence: 15-20 average (vary 8-30 for rhythm)
• Sentences per paragraph: 1-3 maximum
• Dialogue ratio: 40-60% of total word count
• Active voice: >90% (passive only for specific effects)
• Reading level: 7th-9th grade vocabulary

FORMATTING RULES:
• Block paragraphs (NO indentation ever)
• Single blank line between ALL paragraphs
• New speaker = New paragraph ALWAYS
• Action tags every 2-3 dialogue exchanges

SCENE TYPE MODULATION:
${(scene.conflict?.toLowerCase().includes('fight') || scene.conflict?.toLowerCase().includes('battle') || scene.conflict?.toLowerCase().includes('chase')) ? `
ACTION SCENE PROTOCOL:
• Sentences: 8-12 words average
• Fragments: 15-20% for impact
• Paragraphs: 1-2 sentences max
• Focus: External action, sensory details
• Avoid: Internal monologue during action` :
(scene.emotional_shift?.to?.toLowerCase().includes('sad') || scene.emotional_shift?.to?.toLowerCase().includes('grief') || scene.goal?.toLowerCase().includes('realize') || scene.goal?.toLowerCase().includes('understand')) ? `
EMOTIONAL SCENE PROTOCOL:
• Sentences: 20-25 words allowed
• Fragments: 2-5% for emphasis
• Paragraphs: 3-4 sentences allowed
• Focus: Internal thoughts, memories
• Allow: Longer reflective passages` : `
DIALOGUE SCENE PROTOCOL:
• Sentences: 12-18 words average
• Dialogue lines: 5-15 words each
• Action tags: Every 2-3 exchanges
• Focus: Character voice, conflict
• Maintain: Clear speaker attribution`}

SCENE STRUCTURE:
1. HOOK (0-50 words)
   Start with "${scene.entry_hook}"
   • Immediate conflict/question/tension
   • No exposition or description

2. DEVELOPMENT (100-400 words)
   • Show ${povCharacter?.name} pursuing: ${scene.goal}
   • Every 100 words: change/revelation
   • Balance dialogue with action

3. CONFLICT (300-500 words)
   • Escalate: ${scene.conflict}
   • Use short sentences for tension
   • Increase dialogue frequency

4. CLIMAX (200-300 words)
   • Peak confrontation/decision
   • Fastest pacing, shortest sentences
   • Maximum emotional intensity

5. RESOLUTION (100-200 words)
   • Show outcome: ${scene.outcome}
   • Complete emotional arc to: ${scene.emotional_shift?.to}
   • End with forward momentum hook

FORBIDDEN PRACTICES:
✗ Paragraph indentation
✗ Paragraphs over 3 sentences
✗ Sentences over 30 words (except emotional scenes)
✗ Complex/literary vocabulary
✗ Pure description blocks
✗ Passive voice chains
✗ Complete resolution without hook

CRITICAL FORMATTING RULES (FOLLOW EXACTLY):

1. TWO-NEWLINE PRINCIPLE
After every sentence, use TWO newlines (creating blank lines between paragraphs).

2. ONE SENTENCE PER LINE RULE
- Each dialogue sentence = own paragraph
- Each narrative sentence = own paragraph
- Maximum 2 sentences per paragraph (prefer 1)

3. SENTENCE LENGTH = 8-20 WORDS AVERAGE
Keep sentences short. Punchy. Direct.

WRONG FORMAT (TOO DENSE):
"It's clearly a river," Kael stated, his voice a low rumble. He pointed to a flowing pattern. "See how it branches?"

CORRECT FORMAT (MOBILE OPTIMIZED):
"It's clearly a river."

Kael stated, his voice a low rumble.

He pointed to a flowing pattern.

"See how it branches?"

REQUIRED SCENE STRUCTURE EXAMPLE:

"Where did you find this?"

Maya stared at the data chip.

"Basement of the old lab."

Chen's hands shook slightly.

"You shouldn't have gone there alone."

Maya plugged the chip into her neural interface.

The data flooded her vision.

"My God."

She stumbled backward.

"What is it?"

"These are my memories."

Her voice barely whispered.

"Someone's been editing them for years."

Chen moved closer to the screen.

His face went pale.

"That's impossible."

"Look at the timestamps."

Maya pointed with trembling finger.

"Every trauma therapy session."

"Every major life event."

"All of it modified."

DIALOGUE REQUIREMENTS:
• 60-70% of scene must be dialogue
• Each quoted sentence = new paragraph
• Characters speak frequently
• Short, punchy exchanges
• Mix questions and statements

PACING DYNAMICS:
HIGH TENSION → Short. Fragments. Active verbs.
MEDIUM TENSION → Balanced sentences, varied rhythm.
LOW TENSION → Longer sentences for atmosphere.

TARGET: 800-1500 words of engaging, mobile-optimized prose.`,
      prompt: `Write the COMPLETE scene narrative from beginning to end. Start with the entry hook and develop through to resolution. Begin with: "${scene.entry_hook}"`,
      temperature: 0.85,
    });

    // Post-process the content to ensure proper dialogue formatting
    const formattedContent = formatDialogueContent(object.content);

    return {
      content: formattedContent,
      writing_notes: object.writing_notes
    };
  } catch (error) {
    console.error(`Error generating content for scene ${scene.scene_id}:`, error);

    // Return fallback content if generation fails
    return {
      content: `${scene.entry_hook}\n\nThe scene unfolds as the protagonist pursues ${scene.goal}, but faces ${scene.conflict}. The emotional journey moves from ${scene.emotional_shift?.from} to ${scene.emotional_shift?.to}, culminating in ${scene.outcome}.\n\n[Full scene content generation in progress...]`,
      writing_notes: "Fallback content - generation failed"
    };
  }
}

/**
 * Generate content for all scenes in a story and save to database
 * @param storyId - The story ID
 * @param allScenes - All scenes to generate content for
 * @param allChapters - All chapters for context
 * @param story - Story context
 * @param characters - Character data
 * @param settings - Setting data
 * @param progressCallback - Callback for progress updates
 */
export async function generateAllSceneContent(
  storyId: string,
  allScenes: HNSScene[],
  allChapters: HNSChapter[],
  story: HNSStory,
  characters: HNSCharacter[],
  settings: HNSSetting[],
  progressCallback?: (event: string, data: any) => void
): Promise<void> {
  const totalScenes = allScenes.length;
  let completedScenes = 0;

  console.log(`Phase 7: Generating content for ${totalScenes} scenes...`);
  progressCallback?.("phase7_start", {
    message: `Generating narrative content for ${totalScenes} scenes...`,
    totalScenes,
  });

  for (const scene of allScenes) {
    try {
      // Find the chapter this scene belongs to
      const chapter = allChapters.find(ch => ch.chapter_id === scene.chapter_ref);

      if (!chapter) {
        console.warn(`Chapter not found for scene ${scene.scene_id}`);
        continue;
      }

      // Generate content for this scene
      const { content, writing_notes } = await generateSceneContent(
        scene,
        chapter,
        story,
        characters,
        settings
      );

      // Update the scene in the database immediately
      console.log(`Updating scene ${scene.scene_id} with ${content.split(/\s+/).length} words...`);

      const updateResult = await db
        .update(scenesTable)
        .set({
          content,
          wordCount: content.split(/\s+/).length,
          updatedAt: new Date(),
        })
        .where(eq(scenesTable.id, scene.scene_id || ''))
        .returning();

      if (updateResult.length === 0) {
        console.error(`❌ Failed to update scene ${scene.scene_id} - scene not found in database!`);
      } else {
        console.log(`✅ Scene ${scene.scene_id} updated successfully`);
      }

      completedScenes++;

      // Send progress update
      progressCallback?.("phase7_progress", {
        message: `Generated content for scene ${completedScenes}/${totalScenes}: ${scene.scene_title}`,
        completedScenes,
        totalScenes,
        currentScene: scene.scene_title,
        percentage: Math.round((completedScenes / totalScenes) * 100),
      });

      console.log(`✅ Scene ${completedScenes}/${totalScenes} content generated: ${scene.scene_title}`);

      // Small delay to prevent rate limiting
      if (completedScenes < totalScenes) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Failed to generate content for scene ${scene.scene_id}:`, error);

      // Continue with next scene even if one fails
      progressCallback?.("phase7_warning", {
        message: `Skipped scene: ${scene.scene_title}`,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  console.log(`✅ Phase 7 complete: Generated content for ${completedScenes}/${totalScenes} scenes`);
  progressCallback?.("phase7_complete", {
    message: "Scene content generation complete",
    completedScenes,
    totalScenes,
  });
}