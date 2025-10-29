/**
 * Screenplay Converter Service
 *
 * Converts narrative scene text into panel-by-panel screenplay format
 * optimized for vertical-scroll comics.
 */

import { generateObject } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { z } from 'zod';
import type { HNSScene, HNSCharacter, HNSSetting } from '@/types/hns';

// ============================================
// SCHEMA DEFINITIONS
// ============================================

export const ComicPanelSpecSchema = z.object({
  panel_number: z.number().min(1),
  shot_type: z.enum([
    'establishing_shot',
    'wide_shot',
    'medium_shot',
    'close_up',
    'extreme_close_up',
    'over_shoulder',
    'dutch_angle'
  ]),
  description: z.string().describe('Detailed visual description for image generation'),
  characters_visible: z.array(z.string()).describe('Array of character IDs visible in panel'),
  character_poses: z.record(z.string(), z.string()).describe('Map of character_id to pose description'),
  setting_focus: z.string().describe('Which part of the setting is emphasized'),
  lighting: z.string().describe('Lighting setup and mood'),
  camera_angle: z.string().describe('Camera positioning (e.g., low angle, eye level, birds eye)'),
  narrative: z.string().optional().describe('Narrative text explaining the current situation. REQUIRED when characters_visible is empty.'),
  dialogue: z.array(z.object({
    character_id: z.string(),
    text: z.string().max(100).describe('Max 100 characters for readability'),
    tone: z.string().optional()
  })).default([]),
  sfx: z.array(z.object({
    text: z.string(),
    emphasis: z.enum(['normal', 'large', 'dramatic'])
  })).default([]),
  mood: z.string().default('neutral').describe('Overall emotional tone of the panel')
}).refine(
  (data) => {
    const hasNarrative = !!data.narrative && data.narrative.trim().length > 0;
    const hasDialogue = data.dialogue && data.dialogue.length > 0;
    return hasNarrative || hasDialogue;
  },
  {
    message: 'Every panel MUST have either narrative text OR dialogue. No panel can be without text.'
  }
);

export const ComicScreenplaySchema = z.object({
  scene_id: z.string(),
  scene_title: z.string(),
  total_panels: z.number().min(1).max(12),
  panels: z.array(ComicPanelSpecSchema),
  pacing_notes: z.string().optional(),
  narrative_arc: z.string().describe('How the panels collectively tell the scene story')
});

export type ComicPanelSpec = z.infer<typeof ComicPanelSpecSchema>;
export type ComicScreenplay = z.infer<typeof ComicScreenplaySchema>;

// ============================================
// SCREENPLAY CONVERSION
// ============================================

export interface ConvertToScreenplayOptions {
  scene: HNSScene;
  characters: HNSCharacter[];
  setting: HNSSetting;
  storyGenre: string;
  targetPanelCount?: number;
}

export async function convertSceneToScreenplay(
  options: ConvertToScreenplayOptions
): Promise<ComicScreenplay> {

  const { scene, characters, setting, storyGenre, targetPanelCount } = options;

  console.log(`\n🎬 Converting scene to screenplay: "${scene.scene_title}"`);

  // Build character descriptions
  const characterDescriptions = characters
    .map(c => `${c.name} - ${c.role}: ${c.motivations?.primary || c.summary || 'character'}`)
    .join('\n');

  // Build screenplay prompt
  const screenplayPrompt = `You are an expert comic storyboard artist. Convert this narrative scene into a panel-by-panel screenplay optimized for vertical-scroll comics.

SCENE INFORMATION:
Title: ${scene.scene_title || (scene as any).title}
Goal: ${scene.goal || 'Advance the story'}
Conflict: ${scene.conflict || 'Tension and obstacles'}
Outcome: ${scene.outcome || 'Resolution'}
Emotional Arc: ${scene.emotional_shift?.from || 'neutral'} → ${scene.emotional_shift?.to || 'resolved'}

NARRATIVE CONTENT:
${scene.content}

CHARACTERS PRESENT:
${characterDescriptions}

SETTING:
${setting.name}: ${setting.description}

GENRE: ${storyGenre}

INSTRUCTIONS:
1. Break the narrative into ${targetPanelCount || '8-12'} visual panels (TARGET: ${targetPanelCount || '8-12'} PANELS)
   - Aim for ${targetPanelCount || 10} panels for optimal pacing
   - Use more panels for complex action sequences (up to 12)
   - Use fewer panels for quiet, reflective moments (minimum 8)

2. Shot Type Distribution (for ${targetPanelCount || '8-12'} panels):
   - 1 establishing_shot (scene opening or major location change)
   - 2-3 wide_shot (show full action, multiple characters, environment context)
   - 3-5 medium_shot (main storytelling, conversations, character interactions)
   - 2-3 close_up (emotional beats, reactions, important details)
   - 0-1 extreme_close_up (climactic moments, critical details, intense emotion)
   - 0-1 over_shoulder or dutch_angle (special moments, tension)

3. Each panel must SHOW the action, not tell (minimize narration)

4. Visual Variety and Pacing:
   - Vary shot types to maintain visual interest
   - Use establishing shots sparingly (scene openings, major transitions)
   - Alternate between wide/medium shots for rhythm
   - Save close-ups for emotional peaks
   - Build tension with shot progression (wide → medium → close-up)

5. Maintain character consistency - reference same physical traits across all panels

6. TEXT OVERLAY REQUIREMENT (CRITICAL - EVERY PANEL MUST HAVE TEXT):
   - EVERY PANEL MUST HAVE EITHER NARRATIVE OR DIALOGUE - NO EXCEPTIONS
   - If characters_visible is EMPTY (no characters in panel): MUST include "narrative" text
   - If characters_visible has characters: MUST include at least one "dialogue"
   - Narrative text: 1-2 sentences explaining what's happening in the scene
   - Dialogue: max 2-3 speech bubbles per panel, max 100 chars each
   - VALIDATION ERROR will occur if a panel has neither narrative nor dialogue

7. Add sound effects (SFX) for impactful moments (doors, footsteps, impacts, ambient sounds)

8. Ensure each panel advances the story - no redundant panels

CHARACTER POSING GUIDANCE:
- Describe exact body language and gestures
- Include emotional expressions (eyes, mouth, eyebrows)
- Specify hand positions and arm placement
- Note if character is moving or static

LIGHTING GUIDANCE:
- Match mood: "harsh overhead fluorescent" for interrogation, "warm golden sunset" for romance
- Use dramatic lighting for tension: "strong side lighting creating shadows"
- Use soft lighting for calm moments: "diffused natural light"

CAMERA ANGLE GUIDANCE:
- Low angle: looking up (makes character powerful)
- High angle: looking down (makes character vulnerable)
- Eye level: neutral, conversational
- Dutch angle: tilted (creates unease, action)
- Over shoulder: conversation, two-person scenes

IMPORTANT: This is for a ${storyGenre} story. Match the visual style and tone accordingly.

Return your response as a valid JSON object matching the ComicScreenplay schema.`;

  console.log(`   Sending screenplay generation request...`);

  const result = await generateObject({
    model: gateway('google/gemini-2.5-flash-lite'),
    schema: ComicScreenplaySchema,
    prompt: screenplayPrompt,
    temperature: 0.7,
  });

  const screenplay = result.object;

  console.log(`   ✅ Screenplay generated: ${screenplay.total_panels} panels`);
  console.log(`   Panel types: ${screenplay.panels.map(p => p.shot_type).join(', ')}`);

  return screenplay;
}
