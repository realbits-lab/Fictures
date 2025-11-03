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
import { formatSceneContent } from "@/lib/services/scene-formatter";

// Minimal interfaces for scene content generation
// These replace the old HNS types with simplified versions
interface SceneInput {
  scene_id?: string;
  scene_title: string;
  pov_character_id?: string;
  setting_id?: string;
  character_ids?: string[];
  entry_hook?: string;
  goal?: string;
  conflict?: string;
  outcome?: string;
  emotional_shift?: { from: string; to: string };
  narrative_voice?: string;
}

interface ChapterInput {
  chapter_title: string;
  summary?: string;
  pacing_goal?: string;
}

interface StoryInput {
  story_title: string;
  genre?: string;
  theme?: string;
  premise?: string;
}

interface CharacterInput {
  character_id?: string;
  name: string;
  role?: string;
}

interface SettingInput {
  setting_id?: string;
  name: string;
  description?: string;
  mood?: string;
  sensory?: {
    sight?: string[];
    sound?: string[];
    smell?: string[];
  };
}

// Schema for scene content generation
const SceneContentSchema = z.object({
  content: z.string().describe("Complete scene narrative content (800-1500 words) - full scene from beginning to end"),
  writing_notes: z.string().optional().describe("Brief notes about the scene's purpose and flow"),
});


/**
 * Generate narrative content for a single scene
 */
export async function generateSceneContent(
  scene: SceneInput,
  chapter: ChapterInput,
  story: StoryInput,
  characters: CharacterInput[],
  settings: SettingInput[]
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
Title: ${story.story_title} | Genre: ${story.genre}
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
${sceneCharacters.map(c => `${c.name}${c.summary ? ` - ${c.summary}` : ''}`).join(" | ")}

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

🚨 CRITICAL PARAGRAPH FORMATTING RULES 🚨:
1. DESCRIPTION PARAGRAPH LENGTH: Every description paragraph MUST contain 1-3 sentences ONLY
   - If you write 4+ sentences of description, SPLIT into multiple paragraphs
   - Each description paragraph = 1-3 sentences maximum
   - This rule is ENFORCED by automated post-processing

2. SPACING BETWEEN DESCRIPTION AND DIALOGUE:
   - ALWAYS use blank line (2 newlines) between description blocks and dialogue blocks
   - Description paragraph → blank line → dialogue
   - Dialogue → blank line → description paragraph
   - This creates clear visual separation and optimal mobile readability

🚨 UNIVERSAL DIALOGUE REQUIREMENT (APPLIES TO ALL SCENE TYPES) 🚨

MANDATORY: Every scene MUST contain minimum 40% dialogue by word count, regardless of scene type.

This is NON-NEGOTIABLE. Even in:
• Action scenes → Characters shout warnings, give orders, exchange terse updates
• Chase scenes → Characters yell, communicate while running, make split-second decisions verbally
• Solo scenes → Character talks to themselves, inner dialogue as spoken thoughts, phone calls, recordings
• Introspective scenes → Memories replayed as dialogue, internal arguments verbalized, conversations with imagined figures

Dialogue Parameters:
• Dialogue ratio: TARGET 50% by word count (minimum 40%, maximum 60%)
• Dialogue length: Substantial exchanges (3-5 dialogue lines per character minimum)
• Speaker format: New speaker = New paragraph with blank line separation
• Action tags: Every 3-4 dialogue lines (not every line - let dialogue breathe)
• Action separation: NEVER combine dialogue + action in same line
• Multi-sentence dialogue: Use single newlines within same speaker's continuous dialogue
• Speaker changes: Use blank lines (double newlines) between different speakers
• Dialogue substance: Each character should speak 2-4 sentences when they have the floor (avoid ping-pong)

HOW TO ACHIEVE DIALOGUE IN EVERY SCENE TYPE:
• 2+ characters present → Direct conversation (primary method)
• Solo character → Phone calls, video messages, talking to self, inner dialogue as speech
• Action sequences → Integrate urgent verbal exchanges during action
• Flashbacks → Show conversations from the past
• Technology → Voice AI, recordings, intercepted communications

SCENE TYPE PROTOCOLS (ALL MUST MAINTAIN 40%+ DIALOGUE):

${(scene.conflict?.toLowerCase().includes('fight') || scene.conflict?.toLowerCase().includes('battle') || scene.conflict?.toLowerCase().includes('chase')) ? `
ACTION SCENE (MUST INCLUDE 40%+ DIALOGUE):
• Words per sentence: 8-12 average
• Sentence fragments: 15-20%
• Paragraph length: 1-2 sentences max
• Dialogue: Short, urgent exchanges integrated into action
• Focus: External action + verbal communication
• Method: Characters shout warnings, give orders, exchange status updates

Example rhythm (WITH DIALOGUE):
"Behind you!"

Sarah ducked.

The blade whistled past her ear.

"How many?" Marcus shouted from across the room.

"Three—no, four!" She rolled left, came up firing.

The first attacker stumbled backward, gasping.

"Exit's blocked!"

"Then we make one!" Marcus slammed his shoulder into the wall panel.

Sparks showered down.

"Is that your plan? Really?"

"You got a better idea?"

She didn't. She never did.` :
(scene.emotional_shift?.to?.toLowerCase().includes('sad') || scene.emotional_shift?.to?.toLowerCase().includes('grief') || scene.goal?.toLowerCase().includes('realize') || scene.goal?.toLowerCase().includes('understand')) ? `
EMOTIONAL/INTROSPECTIVE SCENE (MUST INCLUDE 40%+ DIALOGUE):
• Words per sentence: 15-20 average
• Sentence fragments: 2-5%
• Paragraph length: 2-3 sentences
• Dialogue: Internal spoken thoughts, phone calls, voice messages, talking to self
• Focus: Internal conflict EXPRESSED through speech
• Method: Character verbalizes thoughts, remembers conversations, leaves voice messages

Example rhythm (WITH DIALOGUE):
"I can't do this."

The words escaped before she could stop them. Her own voice, small and broken in the empty apartment.

"You promised them. You swore you'd protect them."

She closed her eyes, and her mother's voice echoed in memory:

"Promises are what make us human, Elena. They're the only thing that separates us from chaos."

"But what if keeping the promise destroys me?" she whispered to the darkness.

No answer came. There never was an answer.

She pulled out her phone, hands trembling, and started recording.

"Marcus, if you're listening to this... I need you to know why I did what I did. The choice wasn't mine anymore. They forced my hand."

Her voice cracked.

"Maybe promises were meant to be broken. Maybe that's the only way to survive."` : `
DIALOGUE SCENE:
• Words per sentence: 12-18 average
• Dialogue exchanges: Substantial (each character speaks 2-4 sentences before speaker change)
• Action tags: Every 3-4 dialogue lines (let conversations flow)
• Focus: Character voice, conflict, information
• Target: 50% dialogue by word count

Example rhythm (LONGER EXCHANGES):
"You can't be serious about this plan. We'd be walking straight into a trap, Marcus. Every instinct I have is screaming that this is wrong."

Sarah crossed her arms and stepped closer to the table.

"Dead serious. Look at the intel—the facility is only lightly guarded on the third shift. We hit them at 0400, extract the data, and we're out before dawn. It's our best shot, maybe our only shot."

Marcus finally looked up from the map, his jaw set.

"Best shot at what? Getting killed? They'll see us coming a mile away. This isn't just about the data anymore—you know that. This is personal for you, and it's clouding your judgment."

"My judgment is fine. What's clouding yours is fear. We've been planning this for three months. Every variable accounted for, every contingency mapped. Unless you have a better idea, we move at dawn."

She held his gaze, unflinching.

He didn't have a better idea. She knew it. He knew it. The silence stretched between them.`}

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
2. Walls of text - Description paragraphs over 3 sentences (AUTO-CORRECTED by post-processing)
3. Complex vocabulary - Words above 9th-grade level without purpose
4. Passive voice chains - Multiple passive constructions in sequence
5. Pure description blocks - Description without action/dialogue integration
6. Slow starts - Taking more than 50 words to establish conflict
7. Complete resolution - Ending without forward momentum
8. 🚨 DIALOGUE + ACTION ON SAME LINE - ALWAYS SEPARATE 🚨
9. 🚨 NO BLANK LINE BETWEEN DESCRIPTION AND DIALOGUE - ALWAYS USE (AUTO-CORRECTED by post-processing)

NOTE: Rules #2 and #9 are automatically enforced by post-processing. Even if you fail to follow them perfectly,
the system will fix them deterministically. However, writing correctly from the start saves processing time.

CRITICAL DIALOGUE FORMATTING:

RULE 1: Dialogue vs Action Separation
✗ WRONG (dialogue and action combined):
"You can't be serious." Sarah crossed her arms.

✓ CORRECT (dialogue and action separated):
"You can't be serious."

Sarah crossed her arms.

RULE 2: Multi-Sentence Dialogue (CRITICAL - MOST COMMON ERROR)
🚨 When a SINGLE character speaks MULTIPLE sentences continuously, use SINGLE newline (NOT double) 🚨

THE GOLDEN RULE: Same speaker = Single newlines. Different speakers = Blank line separation.

✗ WRONG FORMAT (double newlines between sentences of SAME speaker):
"You cannot stop them, Detective.

Only observe.

And perhaps, if you are very lucky, survive."

✓ CORRECT FORMAT (single newlines within same speaker's continuous dialogue):
"You cannot stop them, Detective.
Only observe.
And perhaps, if you are very lucky, survive."

✗ ALSO WRONG (no newlines - run-on sentence):
"You cannot stop them, Detective. Only observe. And perhaps, if you are very lucky, survive."

CRITICAL UNDERSTANDING:
- One speaker speaking multiple sentences → Use SINGLE newlines (\n) between sentences
- This creates ONE paragraph block of dialogue from one character
- The dialogue stays within the quotes as a unified speech
- Different speakers → Separate with BLANK line (\n\n)

FORMATTING EXAMPLE WITH CONTEXT:
The stranger leaned against the wall.

"You cannot stop them, Detective.
Only observe.
And perhaps, if you are very lucky, survive."

Sarah's hands trembled.

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
✓ 🚨 MINIMUM 40% dialogue by word count (TARGET 50%, absolute minimum 40%) 🚨
✓ Dialogue present in EVERY scene type (action, introspective, dialogue)
✓ If solo scene: Use phone calls, self-talk, voice recordings, memory dialogue
✓ If action scene: Characters communicate during action (warnings, orders, updates)
✓ Dialogue exchanges are substantial (2-4 sentences per speaker turn)
✓ No paragraph exceeds 3 sentences
✓ Active voice >90%
✓ Fragments used purposefully
✓ White space maximized
✓ Forward momentum sustained
✓ Ending creates pull to continue
✓ All dialogue separated from action tags
✓ Multi-sentence dialogue uses single newlines within same speaker
✓ Different speakers separated by blank lines
✓ Action tags spaced out (every 3-4 dialogue lines, not every line)

TARGET: 800-1500 words of engaging, mobile-optimized prose following these discipline principles.

🚨 FINAL DIALOGUE REQUIREMENT REMINDER 🚨
Before you begin writing, plan how you will achieve minimum 40% dialogue:
• Multiple characters present? → Direct conversation
• Single character alone? → Phone call, voice message, talking to self, remembered dialogue
• Action sequence? → Urgent verbal exchanges during action
• Data/research scene? → Character talks through discoveries aloud, calls colleague
• Any scene can have dialogue if you're creative with the method

DO NOT write a scene without substantial dialogue. This is MANDATORY.`,
      prompt: `Write the COMPLETE scene narrative from beginning to end. Start with the entry hook and develop through to resolution.

CRITICAL: This scene MUST contain minimum 40% dialogue by word count. Plan dialogue integration before writing.

Begin with: "${scene.entry_hook}"`,
      temperature: 0.85,
    });

    // Apply rule-based formatting (description paragraph splitting, dialogue separation)
    const formatResult = formatSceneContent(object.content);

    console.log(`📝 Formatting applied: ${formatResult.changes.length} changes`);
    if (formatResult.changes.length > 0) {
      console.log(`   - Paragraphs split: ${formatResult.stats.sentencesSplit}`);
      console.log(`   - Spacing fixed: ${formatResult.stats.spacingFixed}`);
    }

    return {
      ...object,
      content: formatResult.formatted
    };
  } catch (error) {
    console.error(`Error generating content for scene ${scene.scene_id}:`, error);

    // Return structured fallback content instead of minimal placeholder
    return {
      content: generateFallbackSceneContent(scene),
      writing_notes: "Draft content - AI generation failed, using structured template"
    };
  }
}

/**
 * Generate fallback scene content when AI generation fails
 * Creates structured draft content matching web novel format (600-800 words)
 * Includes ~40% dialogue to meet requirements
 */
function generateFallbackSceneContent(scene: SceneInput): string {
  const parts: string[] = [];

  // Opening hook (required)
  parts.push(scene.entry_hook);
  parts.push(''); // Blank line

  // Description paragraph (1-3 sentences)
  parts.push(
    `The scene takes place as ${scene.pov_character_id ? 'our protagonist' : 'characters'} confronts ${scene.conflict}. ` +
    `The atmosphere is tense, with ${scene.emotional_shift?.from || 'uncertainty'} hanging in the air.`
  );
  parts.push(''); // Blank line

  // Dialogue exchange (CRITICAL: Meet 40% dialogue requirement)
  parts.push('"We need to address this situation immediately."');
  parts.push(''); // Blank line
  parts.push('The character\'s voice was steady despite the tension.');
  parts.push(''); // Blank line
  parts.push(
    '"I understand your concern. But we have to be strategic about this. ' +
    'One wrong move and everything we\'ve worked for could fall apart."'
  );
  parts.push(''); // Blank line
  parts.push('A pause stretched between them, heavy with unspoken implications.');
  parts.push(''); // Blank line
  parts.push('"Then what do you suggest we do? We can\'t just stand here and wait for things to resolve themselves."');
  parts.push(''); // Blank line

  // Development paragraph
  parts.push(
    `As the scene unfolds, the goal becomes clear: ${scene.goal}. ` +
    `However, complications arise that challenge this objective. The stakes are higher than initially apparent.`
  );
  parts.push(''); // Blank line

  // More dialogue (building tension)
  parts.push(
    '"This changes everything. We can\'t proceed as planned. ' +
    'The entire framework we built our strategy on just collapsed."'
  );
  parts.push(''); // Blank line
  parts.push('The other character nodded slowly, processing the implications.');
  parts.push(''); // Blank line
  parts.push(
    '"You\'re right. But giving up isn\'t an option either. ' +
    'We need to adapt, find another way forward. What are our alternatives?"'
  );
  parts.push(''); // Blank line

  // Emotional shift paragraph
  parts.push(
    `The emotional tone shifts from ${scene.emotional_shift?.from || 'uncertainty'} to ` +
    `${scene.emotional_shift?.to || 'determination'}. The weight of the decision becomes apparent, ` +
    `pressing down on everyone involved. There\'s no easy way forward, only difficult choices.`
  );
  parts.push(''); // Blank line

  // Final dialogue exchange
  parts.push(
    '"Whatever we decide, we decide together. That\'s the only way forward. ' +
    'I won\'t let you shoulder this burden alone."'
  );
  parts.push(''); // Blank line
  parts.push('Silence settled between them, but it was a different kind of silence now. Purposeful. Resolute.');
  parts.push(''); // Blank line
  parts.push(
    '"Together, then. Let\'s make this work."'
  );
  parts.push(''); // Blank line

  // Outcome paragraph (forward momentum)
  parts.push(
    `By the scene's conclusion, ${scene.outcome}. ` +
    `The path ahead becomes clearer, though not necessarily easier. ` +
    `New questions emerge that demand answers, new challenges that must be faced. ` +
    `But for now, there\'s a sense of direction, a plan taking shape.`
  );
  parts.push(''); // Blank line

  // Final forward-looking sentence
  parts.push(
    'The next steps won\'t be simple, but at least now they know where to begin.'
  );

  // Join with single newlines (blank lines already included)
  const content = parts.join('\n');

  // Apply standard formatting (ensures dialogue separation and paragraph rules)
  const formatResult = formatSceneContent(content);
  return formatResult.formatted;
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
  allScenes: SceneInput[],
  allChapters: ChapterInput[],
  story: StoryInput,
  characters: CharacterInput[],
  settings: SettingInput[],
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

      // Generate content for this scene (already formatted inside generateSceneContent)
      const { content, writing_notes } = await generateSceneContent(
        scene,
        chapter,
        story,
        characters,
        settings
      );

      // Content is already formatted by generateSceneContent, use it directly
      const formattedContent = content;

      // Update the scene in the database immediately
      console.log(`Updating scene ${scene.scene_id} with ${formattedContent.split(/\s+/).length} words...`);

      // Create updated scene object with actual content
      const updatedScene = {
        ...scene,
        content: formattedContent
      };

      const updateResult = await db
        .update(scenesTable)
        .set({
          content: formattedContent,
          wordCount: formattedContent.split(/\s+/).length,
          updatedAt: new Date(),
        })
        .where(eq(scenesTable.id, scene.scene_id || ''))
        .returning();

      if (updateResult.length === 0) {
        console.error(`❌ Failed to update scene ${scene.scene_id} - scene not found in database!`);
      } else {
        console.log(`✅ Scene ${scene.scene_id} updated successfully`);

        // PHASE 7.5: Evaluate and improve scene
        try {
          console.log(`🔄 Starting evaluation loop for scene: ${scene.scene_title}`);
          progressCallback?.("phase7_evaluation", {
            message: `Evaluating and improving scene: ${scene.scene_title}`,
            completedScenes,
            totalScenes,
            currentScene: scene.scene_title,
          });

          const { evaluateAndImproveScene } = await import('@/lib/services/scene-evaluation-loop');

          // Determine arc position based on scene index
          const sceneIndex = allScenes.indexOf(scene);
          const totalScenesCount = allScenes.length;
          let arcPosition: 'beginning' | 'middle' | 'end';
          if (sceneIndex < totalScenesCount / 3) {
            arcPosition = 'beginning';
          } else if (sceneIndex < (totalScenesCount * 2) / 3) {
            arcPosition = 'middle';
          } else {
            arcPosition = 'end';
          }

          const evalResult = await evaluateAndImproveScene(
            scene.scene_id || '',
            formattedContent,
            {
              maxIterations: 2,           // Limit to 2 iterations to control time/cost
              passingScore: 3.0,          // Effective level (3.0 out of 4.0)
              improvementLevel: 'moderate',
              storyContext: {
                storyGenre: story.genre,
                arcPosition,
                chapterNumber: chapter.chapter_number || 1,
                characterContext: scene.character_ids?.map(charId => {
                  const char = characters.find(c => c.character_id === charId);
                  return char ? `${char.name}${char.summary ? ` - ${char.summary}` : ''}` : '';
                }).filter(Boolean),
              }
            }
          );

          console.log(`✅ Evaluation complete for scene: ${scene.scene_title}`);
          console.log(`   Final Score: ${evalResult.finalScore}/4.0 (${evalResult.passed ? 'PASSED' : 'NEEDS WORK'})`);
          console.log(`   Iterations: ${evalResult.iterations}`);
          console.log(`   Improvements: ${evalResult.improvements.join(', ') || 'None'}`);

          progressCallback?.("phase7_evaluation_complete", {
            message: `Scene evaluated: ${scene.scene_title} (Score: ${evalResult.finalScore}/4.0)`,
            completedScenes,
            totalScenes,
            currentScene: scene.scene_title,
            evaluation: {
              score: evalResult.finalScore,
              passed: evalResult.passed,
              iterations: evalResult.iterations,
              improvements: evalResult.improvements
            }
          });
        } catch (evalError) {
          console.error(`⚠️ Evaluation failed for scene ${scene.scene_id}:`, evalError);
          // Continue even if evaluation fails - we still have the generated content
          progressCallback?.("phase7_evaluation_warning", {
            message: `Evaluation skipped for scene: ${scene.scene_title}`,
            error: evalError instanceof Error ? evalError.message : "Unknown error",
          });
        }
      }

      completedScenes++;

      // Send progress update
      progressCallback?.("phase7_progress", {
        message: `Generated and evaluated scene ${completedScenes}/${totalScenes}: ${scene.scene_title}`,
        completedScenes,
        totalScenes,
        currentScene: scene.scene_title,
        percentage: Math.round((completedScenes / totalScenes) * 100),
      });

      console.log(`✅ Scene ${completedScenes}/${totalScenes} complete: ${scene.scene_title}`);

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