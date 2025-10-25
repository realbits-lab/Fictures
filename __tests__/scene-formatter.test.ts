/**
 * Scene Formatter Tests
 *
 * Tests the rule-based scene formatting system
 */

import {
  formatSceneContent,
  validateSceneFormatting,
  getFormattingStats,
} from '@/lib/services/scene-formatter';

describe('Scene Formatter', () => {
  describe('formatSceneContent', () => {
    test('should split description paragraphs with more than 3 sentences', () => {
      const input = `Sarah walked into the room. The walls were painted a dull gray, and the furniture was sparse. She noticed a desk in the corner with papers scattered across it. The window overlooked a busy street, and she could hear the sounds of traffic below.

"What are you doing here?" Marcus asked.`;

      const result = formatSceneContent(input);

      expect(result.changes.length).toBeGreaterThan(0);
      expect(result.changes.some(c => c.type === 'paragraph_split')).toBe(true);
      expect(result.stats.sentencesSplit).toBeGreaterThan(0);
    });

    test('should add spacing between description and dialogue', () => {
      const input = `Sarah walked into the room. The walls were painted a dull gray.
"What are you doing here?" Marcus asked.`;

      const result = formatSceneContent(input);

      // Should have proper spacing in output
      expect(result.formatted).toContain('\n\n"What are you doing here?"');
    });

    test('should not modify already correctly formatted content', () => {
      const input = `Sarah walked into the room. The walls were painted a dull gray.

"What are you doing here?" Marcus asked.

She turned to face him.

"I had to see you."`;

      const result = formatSceneContent(input);

      // Content is already correctly formatted, so output should match input
      // (formatter may report internal changes during normalization, but final output is the same)
      expect(result.formatted).toBe(input);

      // Should pass validation
      const validation = validateSceneFormatting(result.formatted);
      expect(validation.isValid).toBe(true);
    });

    test('should handle multiple formatting issues in one pass', () => {
      const input = `Sarah walked into the room. The walls were painted a dull gray, and the furniture was sparse. She noticed a desk in the corner with papers scattered across it. The window overlooked a busy street.
"What are you doing here?" Marcus asked.
She turned to face him. Her hands were trembling. She couldn't meet his eyes.`;

      const result = formatSceneContent(input);

      expect(result.changes.length).toBeGreaterThan(0);
      expect(result.stats.sentencesSplit).toBeGreaterThan(0);
    });

    test('should preserve dialogue formatting', () => {
      const input = `"You cannot stop them, Detective.
Only observe.
And perhaps, if you are very lucky, survive."

Sarah's hands trembled.`;

      const result = formatSceneContent(input);

      // Dialogue should remain intact (including quotes)
      expect(result.formatted).toContain('"You cannot stop them, Detective.');
      expect(result.formatted).toContain('Only observe.');
      expect(result.formatted).toContain('And perhaps, if you are very lucky, survive."');

      // Should have proper spacing between dialogue and description
      expect(result.formatted).toContain('\n\nSarah\'s hands trembled.');
    });
  });

  describe('validateSceneFormatting', () => {
    test('should detect description paragraphs with too many sentences', () => {
      const content = `Sarah walked into the room. The walls were painted a dull gray. The furniture was sparse and outdated. Papers were scattered everywhere.`;

      const result = validateSceneFormatting(content);

      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].rule).toBe('max_sentences');
    });

    test('should pass validation for correctly formatted content', () => {
      const content = `Sarah walked into the room. The walls were painted a dull gray.

"What are you doing here?" Marcus asked.

She turned to face him.`;

      const result = validateSceneFormatting(content);

      expect(result.isValid).toBe(true);
      expect(result.violations.length).toBe(0);
    });
  });

  describe('getFormattingStats', () => {
    test('should correctly count paragraphs and block types', () => {
      const content = `Sarah walked into the room.

"What are you doing here?" Marcus asked.

She turned to face him.

"I had to see you."`;

      const stats = getFormattingStats(content);

      expect(stats.totalParagraphs).toBe(4);
      expect(stats.descriptionParagraphs).toBe(2);
      expect(stats.dialogueParagraphs).toBe(2);
      expect(stats.blockTransitions).toBe(3); // desc->dial, dial->desc, desc->dial
    });

    test('should calculate average sentences per description', () => {
      const content = `Sarah walked into the room.

"Hello."

The walls were gray. The floor was cold.

"Goodbye."`;

      const stats = getFormattingStats(content);

      expect(stats.descriptionParagraphs).toBe(2);
      // First description: 1 sentence, Second description: 2 sentences
      // Average = (1 + 2) / 2 = 1.5
      expect(stats.averageSentencesPerDescription).toBeCloseTo(1.5, 1);
    });

    test('should identify longest description paragraph', () => {
      const content = `Short.

"Dialog."

This is a longer description. It has two sentences.

"More dialog."`;

      const stats = getFormattingStats(content);

      expect(stats.longestDescriptionSentences).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty content', () => {
      const result = formatSceneContent('');

      expect(result.formatted).toBe('');
      expect(result.changes.length).toBe(0);
    });

    test('should handle content with only dialogue', () => {
      const content = `"Hello there."

"How are you?"

"I'm fine, thanks."`;

      const result = formatSceneContent(content);

      // Should not make changes to dialogue-only content
      expect(result.changes.length).toBe(0);
    });

    test('should handle content with only description', () => {
      const content = `The room was empty.

Papers lay scattered on the floor.

Nobody had been here in years.`;

      const result = formatSceneContent(content);

      // All paragraphs have 1 sentence, so no changes needed
      expect(result.changes.length).toBe(0);
    });

    test('should handle abbreviations correctly', () => {
      const content = `Dr. Smith walked in. Mrs. Johnson followed. Mr. Davis stayed outside.

"Good morning."`;

      const result = formatSceneContent(content);

      // Should split because 3 sentences, but abbreviations should be handled correctly
      expect(result.formatted).toContain('Dr. Smith');
      expect(result.formatted).toContain('Mrs. Johnson');
      expect(result.formatted).toContain('Mr. Davis');
    });
  });

  describe('Integration with Scene Generation', () => {
    test('should handle realistic scene content', () => {
      const realisticScene = `The stranger leaned against the wall. His eyes were cold, calculating, and unnervingly steady.

"You cannot stop them, Detective.
Only observe.
And perhaps, if you are very lucky, survive."

Sarah's hands trembled. She tried to steady her breathing, but the room felt smaller with each passing second.

"Who are you?" she managed to ask.

He smiled, but it didn't reach his eyes. The expression sent chills down her spine, making her acutely aware of how isolated they were.`;

      const result = formatSceneContent(realisticScene);

      // All description paragraphs have 2 sentences (within 1-3 limit), so no splits needed
      // But the formatter should preserve the structure
      expect(result.stats.formattedParagraphs).toBeGreaterThanOrEqual(5);

      // Should preserve dialogue structure
      expect(result.formatted).toContain('You cannot stop them, Detective.');
      expect(result.formatted).toContain('Only observe.');
      expect(result.formatted).toContain('And perhaps, if you are very lucky, survive.');

      // Final result should be valid
      const validation = validateSceneFormatting(result.formatted);
      expect(validation.isValid).toBe(true);
    });

    test('should split paragraphs with 4+ sentences', () => {
      const longParagraph = `The stranger leaned against the wall. His eyes were cold and calculating. The room felt oppressive. Sarah's heart raced with fear.

"What do you want?" she asked.`;

      const result = formatSceneContent(longParagraph);

      // Should split the 4-sentence paragraph
      expect(result.stats.sentencesSplit).toBeGreaterThanOrEqual(1);

      // Final result should be valid
      const validation = validateSceneFormatting(result.formatted);
      expect(validation.isValid).toBe(true);
    });
  });
});
