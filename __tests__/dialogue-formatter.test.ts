import { formatDialogue, formatDialogueEnhanced, validateDialogueFormatting, formatSceneContent } from '@/lib/services/dialogue-formatter';

describe('Dialogue Formatter', () => {
  describe('formatDialogue', () => {
    it('should add two newlines before dialogue when previous character is not a newline', () => {
      const input = 'He said "Hello there."';
      const expected = 'He said \n\n"Hello there."\n\n';
      expect(formatDialogue(input)).toBe(expected);
    });

    it('should add one newline before dialogue when previous character is one newline', () => {
      const input = 'He said\n"Hello there."';
      const expected = 'He said\n\n"Hello there."\n\n';
      expect(formatDialogue(input)).toBe(expected);
    });

    it('should not add newlines when already properly formatted', () => {
      const input = 'He said\n\n"Hello there."\n\n';
      const expected = 'He said\n\n"Hello there."\n\n';
      expect(formatDialogue(input)).toBe(expected);
    });

    it('should handle multiple dialogue sentences', () => {
      const input = '"First sentence." He paused. "Second sentence."';
      const expected = '\n\n"First sentence."\n\n He paused. \n\n"Second sentence."\n\n';
      expect(formatDialogue(input)).toBe(expected);
    });

    it('should handle curly quotes', () => {
      const input = 'She said "Hello" and then "Goodbye"';
      const expected = 'She said \n\n"Hello"\n\n and then \n\n"Goodbye"\n\n';
      expect(formatDialogue(input)).toBe(expected);
    });
  });

  describe('formatDialogueEnhanced', () => {
    it('should isolate dialogue lines with blank lines', () => {
      const input = `He walked in.
"What are you doing?"
She looked up.
"Nothing much."`;
      const expected = `He walked in.

"What are you doing?"

She looked up.

"Nothing much."
`;
      expect(formatDialogueEnhanced(input)).toBe(expected);
    });

    it('should handle mixed narrative and dialogue', () => {
      const input = `The door opened slowly.
"Is anyone there?" John asked nervously.
No response came.
He stepped forward. "Hello?"
Still nothing.`;
      const expected = `The door opened slowly.

"Is anyone there?" John asked nervously.

No response came.
He stepped forward.

"Hello?"

Still nothing.
`;
      expect(formatDialogueEnhanced(input)).toBe(expected);
    });

    it('should clean up excessive empty lines', () => {
      const input = `"Line one."




"Line two."`;
      const expected = `"Line one."


"Line two."
`;
      expect(formatDialogueEnhanced(input)).toBe(expected);
    });
  });

  describe('validateDialogueFormatting', () => {
    it('should validate properly formatted dialogue', () => {
      const input = `He said something.

"This is dialogue."

She responded.`;
      const result = validateDialogueFormatting(input);
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect dialogue without blank line before', () => {
      const input = `He said something.
"This is dialogue."

She responded.`;
      const result = validateDialogueFormatting(input);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Line 2: Dialogue not isolated with blank line before');
    });

    it('should detect dialogue without blank line after', () => {
      const input = `He said something.

"This is dialogue."
She responded.`;
      const result = validateDialogueFormatting(input);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Line 3: Dialogue not isolated with blank line after');
    });

    it('should detect multiple dialogue sentences in single paragraph', () => {
      const input = `He said something.

"First sentence." "Second sentence."

She responded.`;
      const result = validateDialogueFormatting(input);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Line 3: Multiple dialogue sentences in single paragraph');
    });

    it('should provide fixed text when issues are found', () => {
      const input = `He said something.
"This needs fixing."
She responded.`;
      const result = validateDialogueFormatting(input);
      expect(result.isValid).toBe(false);
      expect(result.fixedText).toBeDefined();
      expect(result.fixedText).toContain('\n\n"This needs fixing."\n\n');
    });
  });

  describe('formatSceneContent', () => {
    it('should format a complete scene with dialogue', () => {
      const input = `The room was dark.
"Who's there?" Maya whispered.
Chen stepped forward. "It's me."
"Thank goodness," she replied.
They both relaxed.`;

      const result = formatSceneContent(input);

      // Verify dialogue is properly isolated
      expect(result).toContain('\n\n"Who\'s there?" Maya whispered.\n\n');
      expect(result).toContain('\n\n"It\'s me."\n\n');
      expect(result).toContain('\n\n"Thank goodness," she replied.\n\n');

      // Validate the result
      const validation = validateDialogueFormatting(result);
      expect(validation.isValid).toBe(true);
    });

    it('should handle complex scene with mixed content', () => {
      const input = `The ancient map spread across the table like a window to another world. Maya traced her finger along the faded ink lines.
"This can't be right," she muttered.
Kael leaned closer. His breath caught. "Wait. Look at this symbol."
"What about it?" Maya squinted at the marking.
"I've seen it before." He pulled out his notebook. "In the ruins."
Maya's eyes widened. "You mean..."
"Yes." Kael nodded grimly. "We've been looking in the wrong place."
Thunder rolled outside. The candle flickered.`;

      const result = formatSceneContent(input);

      // Validate the formatted result
      const validation = validateDialogueFormatting(result);
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should be idempotent - formatting twice should give same result', () => {
      const input = `Start of scene.
"Some dialogue here."
Middle part.
"More dialogue."
End of scene.`;

      const firstFormat = formatSceneContent(input);
      const secondFormat = formatSceneContent(firstFormat);

      expect(secondFormat).toBe(firstFormat);
    });
  });
});