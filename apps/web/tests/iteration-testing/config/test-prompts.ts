/**
 * Test Prompts Configuration for Iteration Testing
 *
 * These prompts are designed to test different aspects of the 5 Core Principles:
 * 1. Cyclic Structure
 * 2. Intrinsic Motivation
 * 3. Earned Consequence
 * 4. Character Transformation
 * 5. Emotional Resonance
 */

export interface TestPrompt {
  id: string;
  name: string;
  prompt: string;
  focusPrinciples: string[];
  description: string;
  expectedGenre?: string;
  expectedTone?: string;
}

export const TEST_PROMPTS: TestPrompt[] = [
  {
    id: 'last-garden',
    name: 'The Last Garden',
    prompt: 'A story about a refugee woman who starts a garden in a destroyed city and the former enemy soldier who helps her without revealing his identity',
    focusPrinciples: ['emotional-resonance', 'earned-consequence', 'intrinsic-motivation'],
    description: 'Baseline test story - proven to test emotional depth and earned karma',
    expectedGenre: 'slice',
    expectedTone: 'bittersweet'
  },
  {
    id: 'broken-healer',
    name: 'The Broken Healer',
    prompt: 'A disgraced doctor with severe impostor syndrome treats patients in a free clinic, haunted by a past mistake',
    focusPrinciples: ['character-transformation', 'intrinsic-motivation'],
    description: 'Tests character transformation arc and genuine virtue',
    expectedGenre: 'slice',
    expectedTone: 'hopeful'
  },
  {
    id: 'thiefs-gift',
    name: "The Thief's Gift",
    prompt: 'A street thief who steals to survive unknowingly saves a merchant\'s daughter, setting off a chain of unintended consequences',
    focusPrinciples: ['earned-consequence', 'cyclic-structure'],
    description: 'Tests causal linking and cycle perpetuation',
    expectedGenre: 'fantasy',
    expectedTone: 'bittersweet'
  },
  {
    id: 'silent-painter',
    name: 'The Silent Painter',
    prompt: 'A mute artist paints in a forgotten cathedral, each painting mysteriously bringing hope to those who view it',
    focusPrinciples: ['emotional-resonance', 'setting-amplification'],
    description: 'Tests setting element arrays and emotional impact',
    expectedGenre: 'fantasy',
    expectedTone: 'hopeful'
  },
  {
    id: 'rivals-debt',
    name: "The Rival's Debt",
    prompt: 'Two rival scholars compete for a prestigious position, but one\'s act of integrity years ago returns in an unexpected way',
    focusPrinciples: ['earned-consequence', 'temporal-separation'],
    description: 'Tests Pattern A timing - temporal separation between virtue and consequence',
    expectedGenre: 'slice',
    expectedTone: 'hopeful'
  }
];

export const getTestPrompt = (id: string): TestPrompt | undefined => {
  return TEST_PROMPTS.find(p => p.id === id);
};

export const getTestPromptsByPrinciple = (principle: string): TestPrompt[] => {
  return TEST_PROMPTS.filter(p => p.focusPrinciples.includes(principle));
};

export const DEFAULT_TEST_CONFIG = {
  iterations: 5,
  evaluationMode: 'thorough' as const,
  promptVersion: 'v1.0',
  testPrompts: ['last-garden', 'broken-healer', 'thiefs-gift', 'silent-painter']
};