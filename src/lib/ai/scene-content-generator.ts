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
import { formatSceneContent } from "@/lib/services/dialogue-formatter";
import { cleanComponentHnsData } from "@/lib/utils/hns-data-cleaner";

// Schema for scene content generation
const SceneContentSchema = z.object({
  content: z.string().describe("Complete scene narrative content (800-1500 words) - full scene from beginning to end"),
  writing_notes: z.string().optional().describe("Brief notes about the scene's purpose and flow"),
});


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

🚨 CRITICAL: DIALOGUE AND ACTION MUST BE ON SEPARATE LINES 🚨

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

== SCENE WRITING DISCIPLINE ==

CORE PRINCIPLES:
• Mobile-first readability (smartphone screen optimization)
• Momentum-driven narrative (every element drives story forward)
• Zero friction (remove stylistic barriers to rapid consumption)
• Binge optimization (design for continuous reading)

QUANTITATIVE PARAMETERS:

Sentence Structure:
• Words per sentence: 15-20 average (vary 8-30 for rhythm)
• Sentence fragments: 5-10% for emphasis
• Active voice: >90% (passive only for specific effects)
• Vocabulary: 7th-9th grade level (common words, concrete nouns, strong verbs)

Paragraph Structure:
• Sentences per paragraph: 1-3 sentences maximum
• Formatting: Block style (NO indentation ever)
• White space: Maximum (short paragraphs create visual breathing room)
• Single blank line between paragraphs

Dialogue Parameters:
• Dialogue ratio: 40-60% by word count
• Speaker format: New speaker = New paragraph with blank line separation
• Action tags: Every 2-3 dialogue lines
• Action separation: NEVER combine dialogue + action in same line
• Multi-sentence dialogue: Use single newlines within same speaker's continuous dialogue
• Speaker changes: Use blank lines (double newlines) between different speakers

SCENE TYPE PROTOCOLS:

${(scene.conflict?.toLowerCase().includes('fight') || scene.conflict?.toLowerCase().includes('battle') || scene.conflict?.toLowerCase().includes('chase')) ? `
ACTION SCENE:
• Words per sentence: 8-12 average
• Sentence fragments: 15-20%
• Paragraph length: 1-2 sentences max
• Focus: External action, sensory details
• Avoid: Internal monologue, complex emotions

Example rhythm:
He dodged left.
The blade whistled past his ear. Close. Too close.
His fist connected with ribs—a wet crunch.
The enemy stumbled backward, gasping.` :
(scene.emotional_shift?.to?.toLowerCase().includes('sad') || scene.emotional_shift?.to?.toLowerCase().includes('grief') || scene.goal?.toLowerCase().includes('realize') || scene.goal?.toLowerCase().includes('understand')) ? `
EMOTIONAL/INTROSPECTIVE SCENE:
• Words per sentence: 15-20 average
• Sentence fragments: 2-5%
• Paragraph length: 3-4 sentences
• Focus: Internal thoughts, memories, feelings
• Allow: Moderate sentence length for reflection

Example rhythm:
The weight of the decision pressed down on her shoulders like a physical burden she couldn't shake. Every option led to pain—for her, for them, for everyone she'd sworn to protect. She closed her eyes and let herself remember the promise she'd made all those years ago.

Maybe promises were meant to be broken.` : `
DIALOGUE SCENE:
• Words per sentence: 12-18 average
• Dialogue lines: Short, punchy (5-15 words)
• Action tags: Every 2-3 exchanges
• Focus: Character voice, conflict, information

Example rhythm:
"You can't be serious."

Sarah crossed her arms.

"Dead serious."

Marcus didn't look up from the map.

"We leave at dawn."

"That's suicide."

"That's our only chance."

He finally met her gaze.

"Unless you have a better idea?"

She didn't.`}

CONTENT GENERATION RULES:

1. Opening Hook Requirements:
   • First sentence: Start with "${scene.entry_hook}" for immediate engagement
   • First paragraph: Establish conflict, question, or tension
   • Avoid: Info dumps, lengthy descriptions, slow builds

2. Scene Progression:
   • Every 100 words: Something must change (revelation, action, emotion)
   • Every paragraph: Advance plot, character, or tension
   • Never: Static description without narrative purpose
   • Goal: ${scene.goal}
   • Conflict: ${scene.conflict}
   • Outcome: ${scene.outcome}

3. Ending Momentum:
   • Final paragraph: Create forward pull to next scene
   • Options: Unresolved question, new complication, emotional shift
   • Never: Complete resolution without future hook
   • Emotional shift: ${scene.emotional_shift?.from} → ${scene.emotional_shift?.to}

FORBIDDEN PRACTICES (NEVER USE):
1. Paragraph indentation - Breaks mobile formatting
2. Walls of text - Paragraphs over 4 sentences
3. Complex vocabulary - Words above 9th-grade level without purpose
4. Passive voice chains - Multiple passive constructions in sequence
5. Pure description blocks - Description without action/dialogue integration
6. Slow starts - Taking more than 50 words to establish conflict
7. Complete resolution - Ending without forward momentum
8. 🚨 DIALOGUE + ACTION ON SAME LINE - ALWAYS SEPARATE 🚨

CRITICAL DIALOGUE FORMATTING:

RULE 1: Dialogue vs Action Separation
✗ WRONG (dialogue and action combined):
"You can't be serious." Sarah crossed her arms.

✓ CORRECT (dialogue and action separated):
"You can't be serious."

Sarah crossed her arms.

RULE 2: Multi-Sentence Dialogue
When a single character speaks multiple sentences continuously:
✗ WRONG (double newlines between dialogue sentences):
"You cannot stop them, Detective.

Only observe.

And perhaps, if you are very lucky, survive."

✓ CORRECT (single newlines within same speaker's dialogue):
"You cannot stop them, Detective.
Only observe.
And perhaps, if you are very lucky, survive."

RULE 3: Different Speakers
When speakers change, use blank line separation:
✓ CORRECT:
"It's clearly a river."

Kael stated, his voice a low rumble.

"See how it branches?"

Sarah nodded slowly.

DYNAMIC STYLE MODULATION (Pacing Through Prose):
• HIGH TENSION → Short sentences. Fragments. Active verbs.
• MEDIUM TENSION → Balanced sentences, mixing lengths for rhythm.
• LOW TENSION → Moderate sentences allowing for reflection and atmosphere.

Emotional Intensity Mapping:
• CRISIS: 8-10 word sentences, heavy fragments
• CONFLICT: 12-15 word sentences, occasional fragments
• TENSION: 15-18 word sentences, standard structure
• CALM: 15-20 word sentences, moderate complexity

IMPLEMENTATION CHECKLIST:
✓ Hook within first 30 words
✓ 40-60% dialogue ratio maintained
✓ No paragraph exceeds 3 sentences
✓ Active voice >90%
✓ Fragments used purposefully
✓ White space maximized
✓ Forward momentum sustained
✓ Ending creates pull to continue
✓ All dialogue separated from action tags
✓ Multi-sentence dialogue uses single newlines within same speaker
✓ Different speakers separated by blank lines

TARGET: 800-1500 words of engaging, mobile-optimized prose following these discipline principles.`,
      prompt: `Write the COMPLETE scene narrative from beginning to end. Start with the entry hook and develop through to resolution. Begin with: "${scene.entry_hook}"`,
      temperature: 0.85,
    });

    // Apply rule-based dialogue formatting to ensure proper isolation
    const formattedContent = formatSceneContent(object.content);

    return {
      ...object,
      content: formattedContent
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

      // Apply formatting to ensure dialogue rules are followed
      const formattedContent = formatSceneContent(content);

      // Update the scene in the database immediately
      console.log(`Updating scene ${scene.scene_id} with ${formattedContent.split(/\s+/).length} words...`);

      // Create updated scene object with actual content for hnsData
      const updatedScene = {
        ...scene,
        content: formattedContent
      };

      const updateResult = await db
        .update(scenesTable)
        .set({
          content: formattedContent,
          wordCount: formattedContent.split(/\s+/).length,
          hnsData: cleanComponentHnsData(updatedScene),
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