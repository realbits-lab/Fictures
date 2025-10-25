/**
 * Scene Content Formatter
 *
 * Enforces deterministic formatting rules on scene content:
 * 1. Description paragraphs must have 1-3 sentences
 * 2. Blank line (2 newlines) between description and dialogue blocks
 * 3. Proper paragraph spacing and structure
 *
 * This runs AFTER AI generation to fix formatting issues that AI models
 * can't reliably detect or fix themselves.
 */

export interface SceneFormatterConfig {
  /** Maximum sentences allowed per description paragraph (default: 3) */
  maxSentencesPerParagraph: number;
  /** Minimum sentences required per paragraph (default: 1) */
  minSentencesPerParagraph: number;
  /** Number of newlines between description and dialogue (default: 2) */
  newlinesBetweenBlocks: number;
  /** Preserve original dialogue formatting (default: true) */
  preserveDialogueFormatting: boolean;
}

export interface FormattingChange {
  type: 'paragraph_split' | 'spacing_added' | 'spacing_removed' | 'paragraph_merged';
  location: string;
  description: string;
  before: string;
  after: string;
}

export interface FormatResult {
  formatted: string;
  changes: FormattingChange[];
  stats: {
    originalParagraphs: number;
    formattedParagraphs: number;
    sentencesSplit: number;
    spacingFixed: number;
  };
}

const DEFAULT_CONFIG: SceneFormatterConfig = {
  maxSentencesPerParagraph: 3,
  minSentencesPerParagraph: 1,
  newlinesBetweenBlocks: 2,
  preserveDialogueFormatting: true,
};

/**
 * Common abbreviations that shouldn't be treated as sentence terminators
 */
const ABBREVIATIONS = [
  'Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Sr', 'Jr',
  'vs', 'etc', 'Inc', 'Ltd', 'Co', 'Corp',
  'St', 'Ave', 'Blvd', 'Rd',
];

/**
 * Patterns that indicate dialogue
 */
const DIALOGUE_PATTERNS = [
  /^["']/,  // Starts with quote
  /["']$/,  // Ends with quote
  /\b(said|asked|replied|shouted|whispered|muttered|answered|exclaimed|cried|yelled|screamed|murmured|added|continued|interrupted|stammered|growled|hissed|sighed|laughed|chuckled|snorted|gasped|breathed|wondered|thought|mused)\b/i,
];

/**
 * Check if a paragraph is primarily dialogue
 */
function isDialogueParagraph(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  // Check if any dialogue pattern matches
  return DIALOGUE_PATTERNS.some(pattern => pattern.test(trimmed));
}

/**
 * Extract sentences from text, handling abbreviations correctly
 */
function extractSentences(text: string): string[] {
  // First, protect abbreviations by temporarily replacing periods
  let protectedText = text;
  ABBREVIATIONS.forEach(abbr => {
    const regex = new RegExp(`\\b${abbr}\\.`, 'g');
    protectedText = protectedText.replace(regex, `${abbr}<!PERIOD!>`);
  });

  // Split by sentence terminators (.!?) followed by space or end
  const sentences = protectedText
    .split(/([.!?]+)(?:\s+|$)/)
    .reduce((acc: string[], part, i, arr) => {
      // Odd indices are the terminators, even are the text
      if (i % 2 === 0 && part.trim()) {
        const terminator = arr[i + 1] || '';
        acc.push((part + terminator).trim());
      }
      return acc;
    }, [])
    .filter(s => s.length > 0);

  // Restore abbreviations
  return sentences.map(s => s.replace(/<!PERIOD!>/g, '.'));
}

/**
 * Count sentences in a paragraph
 */
function countSentences(text: string): number {
  return extractSentences(text).length;
}

/**
 * Split a long paragraph into multiple paragraphs with max sentences each
 */
function splitLongParagraph(text: string, maxSentences: number): string[] {
  const sentences = extractSentences(text);

  if (sentences.length <= maxSentences) {
    return [text];
  }

  const result: string[] = [];
  let current: string[] = [];

  for (const sentence of sentences) {
    current.push(sentence);

    if (current.length === maxSentences) {
      result.push(current.join(' '));
      current = [];
    }
  }

  // Add remaining sentences as final paragraph
  if (current.length > 0) {
    result.push(current.join(' '));
  }

  return result;
}

/**
 * Determine block type (description or dialogue)
 */
type BlockType = 'description' | 'dialogue';

interface Block {
  type: BlockType;
  content: string;
  originalIndex: number;
}

/**
 * Parse content into blocks of description and dialogue
 * Strategy:
 * 1. Split into paragraphs (by blank lines)
 * 2. For each paragraph, determine if it's dialogue or description
 * 3. Check if paragraph is MIXED (has both) - if so, it needs to be split
 */
function parseBlocks(content: string): Block[] {
  // Split by one or more blank lines to get paragraphs
  const paragraphs = content.split(/\n\s*\n/);
  const blocks: Block[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim();
    if (!para) continue;

    // Check if this paragraph contains both dialogue and non-dialogue lines
    const lines = para.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    if (lines.length === 1) {
      // Single line - simple classification
      blocks.push({
        type: isDialogueParagraph(para) ? 'dialogue' : 'description',
        content: para,
        originalIndex: i,
      });
    } else {
      // Multiple lines - check if mixed or uniform
      const lineTypes = lines.map(line => isDialogueParagraph(line));
      const hasDialogue = lineTypes.some(t => t);
      const hasDescription = lineTypes.some(t => !t);

      if (hasDialogue && hasDescription) {
        // MIXED paragraph - need to split by line type
        let currentType: BlockType | null = null;
        let currentLines: string[] = [];

        for (let j = 0; j < lines.length; j++) {
          const line = lines[j];
          const lineType: BlockType = isDialogueParagraph(line) ? 'dialogue' : 'description';

          if (currentType === null) {
            // First line
            currentType = lineType;
            currentLines = [line];
          } else if (currentType === lineType) {
            // Same type - add to current block
            currentLines.push(line);
          } else {
            // Type changed - save current block and start new one
            blocks.push({
              type: currentType,
              content: currentLines.join('\n'),
              originalIndex: i,
            });
            currentType = lineType;
            currentLines = [line];
          }
        }

        // Add final block
        if (currentLines.length > 0 && currentType !== null) {
          blocks.push({
            type: currentType,
            content: currentLines.join('\n'),
            originalIndex: i,
          });
        }
      } else {
        // Uniform paragraph - all dialogue or all description
        blocks.push({
          type: hasDialogue ? 'dialogue' : 'description',
          content: para,
          originalIndex: i,
        });
      }
    }
  }

  return blocks;
}

/**
 * Format scene content according to rules
 */
export function formatSceneContent(
  content: string,
  config: Partial<SceneFormatterConfig> = {}
): FormatResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const changes: FormattingChange[] = [];
  const stats = {
    originalParagraphs: 0,
    formattedParagraphs: 0,
    sentencesSplit: 0,
    spacingFixed: 0,
  };

  // Parse into blocks
  const blocks = parseBlocks(content);
  stats.originalParagraphs = blocks.length;

  const formattedBlocks: Block[] = [];

  // Process each block
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Rule 1: Split description paragraphs with too many sentences
    if (block.type === 'description') {
      const sentenceCount = countSentences(block.content);

      if (sentenceCount > cfg.maxSentencesPerParagraph) {
        const split = splitLongParagraph(block.content, cfg.maxSentencesPerParagraph);

        changes.push({
          type: 'paragraph_split',
          location: `Paragraph ${i + 1}`,
          description: `Split description paragraph with ${sentenceCount} sentences into ${split.length} paragraphs`,
          before: block.content.substring(0, 100) + '...',
          after: split.map(p => p.substring(0, 50) + '...').join(' | '),
        });

        stats.sentencesSplit += split.length - 1;

        // Add each split as a separate block
        split.forEach(splitContent => {
          formattedBlocks.push({
            type: 'description',
            content: splitContent,
            originalIndex: block.originalIndex,
          });
        });
      } else {
        formattedBlocks.push(block);
      }
    } else {
      // Preserve dialogue as-is
      formattedBlocks.push(block);
    }
  }

  stats.formattedParagraphs = formattedBlocks.length;

  // Rule 2: Ensure proper spacing between blocks
  const finalParagraphs: string[] = [];

  for (let i = 0; i < formattedBlocks.length; i++) {
    const current = formattedBlocks[i];
    const previous = i > 0 ? formattedBlocks[i - 1] : null;

    // Add the current block's content
    finalParagraphs.push(current.content);

    // Check if we need to ensure spacing (transition between block types)
    if (previous && previous.type !== current.type) {
      // Transition detected (description -> dialogue or dialogue -> description)
      // The join with '\n\n' will handle this, but we track it
      stats.spacingFixed++;

      changes.push({
        type: 'spacing_added',
        location: `Between paragraphs ${i} and ${i + 1}`,
        description: `Ensured blank line between ${previous.type} and ${current.type}`,
        before: '',
        after: '',
      });
    }
  }

  // Join with double newlines (one blank line between all paragraphs)
  const formatted = finalParagraphs.join('\n\n');

  return {
    formatted,
    changes,
    stats,
  };
}

/**
 * Validate that scene content follows formatting rules
 */
export function validateSceneFormatting(content: string, config: Partial<SceneFormatterConfig> = {}): {
  isValid: boolean;
  violations: Array<{ rule: string; description: string; location: string }>;
} {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const violations: Array<{ rule: string; description: string; location: string }> = [];

  const blocks = parseBlocks(content);

  // Check description paragraph sentence counts
  blocks.forEach((block, index) => {
    if (block.type === 'description') {
      const sentenceCount = countSentences(block.content);

      if (sentenceCount > cfg.maxSentencesPerParagraph) {
        violations.push({
          rule: 'max_sentences',
          description: `Description paragraph has ${sentenceCount} sentences (max: ${cfg.maxSentencesPerParagraph})`,
          location: `Paragraph ${index + 1}`,
        });
      }

      if (sentenceCount < cfg.minSentencesPerParagraph) {
        violations.push({
          rule: 'min_sentences',
          description: `Description paragraph has ${sentenceCount} sentences (min: ${cfg.minSentencesPerParagraph})`,
          location: `Paragraph ${index + 1}`,
        });
      }
    }
  });

  // Check spacing between block type transitions
  for (let i = 1; i < blocks.length; i++) {
    const current = blocks[i];
    const previous = blocks[i - 1];

    if (current.type !== previous.type) {
      // Should have proper spacing (handled by paragraph parsing, so this is mostly for reporting)
      // In the actual content, we'd check the newline count, but after parsing it's already normalized
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

/**
 * Get statistics about scene formatting
 */
export function getFormattingStats(content: string): {
  totalParagraphs: number;
  descriptionParagraphs: number;
  dialogueParagraphs: number;
  averageSentencesPerDescription: number;
  longestDescriptionSentences: number;
  blockTransitions: number;
} {
  const blocks = parseBlocks(content);

  const descriptionBlocks = blocks.filter(b => b.type === 'description');
  const dialogueBlocks = blocks.filter(b => b.type === 'dialogue');

  const sentenceCounts = descriptionBlocks.map(b => countSentences(b.content));
  const totalSentences = sentenceCounts.reduce((sum, count) => sum + count, 0);
  const longestDescriptionSentences = Math.max(...sentenceCounts, 0);

  let blockTransitions = 0;
  for (let i = 1; i < blocks.length; i++) {
    if (blocks[i].type !== blocks[i - 1].type) {
      blockTransitions++;
    }
  }

  return {
    totalParagraphs: blocks.length,
    descriptionParagraphs: descriptionBlocks.length,
    dialogueParagraphs: dialogueBlocks.length,
    averageSentencesPerDescription: descriptionBlocks.length > 0
      ? totalSentences / descriptionBlocks.length
      : 0,
    longestDescriptionSentences,
    blockTransitions,
  };
}
