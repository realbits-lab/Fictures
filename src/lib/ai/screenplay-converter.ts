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
  character_poses: z.record(z.string()).describe('Map of character_id to pose description'),
  setting_focus: z.string().describe('Which part of the setting is emphasized'),
  lighting: z.string().describe('Lighting setup and mood'),
  camera_angle: z.string().describe('Camera positioning (e.g., low angle, eye level, birds eye)'),
  dialogue: z.array(z.object({
    character_id: z.string(),
    text: z.string().max(100).describe('Max 100 characters for readability'),
    tone: z.string().optional()
  })).default([]),
  sfx: z.array(z.object({
    text: z.string(),
    emphasis: z.enum(['normal', 'large', 'dramatic'])
  })).default([]),
  gutter_after: z.number().min(0).max(1000).describe('Vertical space after panel in pixels'),
  mood: z.string().describe('Overall emotional tone of the panel')
});

export const ComicScreenplaySchema = z.object({
  scene_id: z.string(),
  scene_title: z.string(),
  total_panels: z.number().min(1).max(3),
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
Title: ${scene.scene_title || scene.title}
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
1. Break the narrative into ${targetPanelCount || '1-3'} visual panels (MAXIMUM 3 PANELS)
2. Each panel must SHOW the action, not tell (minimize narration)
3. Use varied camera angles for visual interest:
   - Use establishing_shot for opening or location changes
   - Use wide_shot for action sequences and multiple characters
   - Use medium_shot for conversations and character interactions
   - Use close_up for emotional moments and important details
   - Use extreme_close_up for intense dramatic moments
4. Maintain character consistency - reference same physical traits
5. Include dialogue (max 2-3 speech bubbles per panel, max 100 chars each)
6. Add sound effects (SFX) for impactful moments (doors, footsteps, impacts)
7. Set gutters:
   - 200px for continuous action (same moment)
   - 400-600px for beat changes (transition to next moment)
   - 800-1000px for scene transitions (change location or major time jump)
8. Ensure each panel advances the story

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
    model: gateway('openai/gpt-4o-mini'),
    schema: ComicScreenplaySchema,
    prompt: screenplayPrompt,
    temperature: 0.7,
  });

  const screenplay = result.object;

  console.log(`   ✅ Screenplay generated: ${screenplay.total_panels} panels`);
  console.log(`   Panel types: ${screenplay.panels.map(p => p.shot_type).join(', ')}`);

  return screenplay;
}
