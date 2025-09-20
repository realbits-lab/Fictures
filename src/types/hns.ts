/**
 * Hierarchical Narrative Schema (HNS) Type Definitions
 * Based on the comprehensive story specification document
 */

// Level 1: Overall Narrative
export interface HNSStory {
  story_id: string;
  story_title: string;
  genre: string[];
  premise: string;
  dramatic_question: string;
  theme: string;
  characters: string[];
  settings: string[];
  parts: string[];
}

// Level 2: Major Sections
export interface HNSPart {
  part_id: string;
  part_title: string;
  structural_role: 'Act 1: Setup' | 'Act 2: Confrontation' | 'Act 3: Resolution';
  summary: string;
  key_beats: string[];
  chapters: string[];
}

// Level 3: Reading Units
export interface HNSChapter {
  chapter_id: string;
  chapter_number: number;
  chapter_title: string;
  part_ref: string;
  summary: string;
  pacing_goal: 'fast' | 'medium' | 'slow' | 'reflective';
  action_dialogue_ratio: string;
  chapter_hook: {
    type: 'revelation' | 'danger' | 'decision' | 'question' | 'emotional_turning_point';
    description: string;
    urgency_level: 'high' | 'medium' | 'low';
  };
  scenes: string[];
}

// Level 4: Individual Scenes
export interface HNSScene {
  scene_id: string;
  scene_number: number;
  chapter_ref: string;
  character_ids: string[];
  setting_id: string;
  pov_character_id: string;
  narrative_voice: 'third_person_limited' | 'first_person' | 'third_person_omniscient';
  summary: string;
  entry_hook: string;
  goal: string;
  conflict: string;
  outcome: 'success' | 'failure' | 'success_with_cost' | 'failure_with_discovery';
  emotional_shift: {
    from: string;
    to: string;
  };
}

// Cross-Level: Character Identity and Context
export interface HNSCharacter {
  character_id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'mentor' | 'ally' | 'neutral';
  archetype: string;
  summary: string;
  storyline: string;
  personality: {
    traits: string[];
    myers_briggs: string;
    enneagram: string;
  };
  backstory: {
    childhood: string;
    education: string;
    career: string;
    relationships: string;
    trauma: string;
  };
  motivations: {
    primary: string;
    secondary: string;
    fear: string;
  };
  voice: {
    speech_pattern: string;
    vocabulary: string;
    verbal_tics: string[];
    internal_voice: string;
  };
  physical_description: {
    age: number;
    ethnicity: string;
    height: string;
    build: string;
    hair_style_color: string;
    eye_color: string;
    facial_features: string;
    distinguishing_marks: string;
    typical_attire: string;
  };
  visual_reference_id?: string;
}

// Cross-Level: Location Context
export interface HNSSetting {
  setting_id: string;
  name: string;
  description: string;
  mood: string;
  sensory: {
    sight: string[];
    sound: string[];
    smell: string[];
    touch: string[];
    taste?: string[];
  };
  visual_style: string;
  visual_references: string[];
  color_palette: string[];
  architectural_style: string;
}

// Complete HNS Document
export interface HNSDocument {
  story: HNSStory;
  parts: HNSPart[];
  chapters: HNSChapter[];
  scenes: HNSScene[];
  characters: HNSCharacter[];
  settings: HNSSetting[];
}

// Helper types for key beats
export const ACT1_BEATS = ['Exposition', 'Inciting Incident', 'Plot Point One'] as const;
export const ACT2_BEATS = ['Rising Action', 'Midpoint', 'Plot Point Two'] as const;
export const ACT3_BEATS = ['Climax', 'Falling Action', 'Resolution'] as const;

export type Act1Beat = typeof ACT1_BEATS[number];
export type Act2Beat = typeof ACT2_BEATS[number];
export type Act3Beat = typeof ACT3_BEATS[number];
export type KeyBeat = Act1Beat | Act2Beat | Act3Beat;

// Validation helpers
export function validateStoryPremise(premise: string): boolean {
  return premise.split(' ').length <= 20;
}

export function validateChapterHook(hook: HNSChapter['chapter_hook']): boolean {
  const validTypes = ['revelation', 'danger', 'decision', 'question', 'emotional_turning_point'];
  const validUrgency = ['high', 'medium', 'low'];
  return validTypes.includes(hook.type) && validUrgency.includes(hook.urgency_level);
}

export function validateSceneOutcome(outcome: HNSScene['outcome']): boolean {
  const validOutcomes = ['success', 'failure', 'success_with_cost', 'failure_with_discovery'];
  return validOutcomes.includes(outcome);
}

// Generation templates
export function createEmptyStory(id: string): HNSStory {
  return {
    story_id: id,
    story_title: '',
    genre: [],
    premise: '',
    dramatic_question: '',
    theme: '',
    characters: [],
    settings: [],
    parts: []
  };
}

export function createEmptyPart(id: string, role: HNSPart['structural_role']): HNSPart {
  return {
    part_id: id,
    part_title: '',
    structural_role: role,
    summary: '',
    key_beats: role === 'Act 1: Setup' ? [...ACT1_BEATS] :
                role === 'Act 2: Confrontation' ? [...ACT2_BEATS] :
                [...ACT3_BEATS],
    chapters: []
  };
}

export function createEmptyChapter(id: string, number: number, partRef: string): HNSChapter {
  return {
    chapter_id: id,
    chapter_number: number,
    chapter_title: '',
    part_ref: partRef,
    summary: '',
    pacing_goal: 'medium',
    action_dialogue_ratio: '50:50',
    chapter_hook: {
      type: 'question',
      description: '',
      urgency_level: 'medium'
    },
    scenes: []
  };
}

export function createEmptyScene(id: string, number: number, chapterRef: string): HNSScene {
  return {
    scene_id: id,
    scene_number: number,
    chapter_ref: chapterRef,
    character_ids: [],
    setting_id: '',
    pov_character_id: '',
    narrative_voice: 'third_person_limited',
    summary: '',
    entry_hook: '',
    goal: '',
    conflict: '',
    outcome: 'success',
    emotional_shift: {
      from: '',
      to: ''
    }
  };
}