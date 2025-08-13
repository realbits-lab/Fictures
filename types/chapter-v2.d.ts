export interface ChapterGenerationRequest {
  storyId: string;
  chapterNumber: number;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  includeContext?: {
    previousChapters?: boolean;
    characters?: boolean;
    outline?: boolean;
  };
}

export interface ChapterGenerationContext {
  storyTitle: string;
  storyDescription?: string;
  genre?: string;
  previousChapters?: Array<{
    chapterNumber: number;
    title: string;
    summary: string;
  }>;
  characters?: Array<{
    name: string;
    description: string;
    role: string;
  }>;
  outline?: string;
}

export interface ChapterSaveRequest {
  storyId: string;
  chapterNumber: number;
  title: string;
  content: string;
  summary?: string;
}

export interface ChapterGenerationHistory {
  id: string;
  prompt: string;
  content: string;
  timestamp: Date;
  tokens: number;
}

export interface ChapterEditorState {
  content: string;
  isEditing: boolean;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  wordCount: number;
}

export interface ChapterGenerationState {
  isGenerating: boolean;
  content: string;
  error: string | null;
  generationHistory: ChapterGenerationHistory[];
}

export interface UseChapterGenerationReturn {
  isGenerating: boolean;
  content: string;
  error: string | null;
  generationHistory: ChapterGenerationHistory[];
  generate: (prompt: string) => Promise<void>;
  regenerate: (historyId: string) => Promise<void>;
  cancel: () => void;
  clear: () => void;
  getContext: () => Promise<ChapterGenerationContext>;
  saveContent: () => Promise<void>;
}

export interface UseChapterEditorReturn {
  content: string;
  isEditing: boolean;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  wordCount: number;
  setContent: (content: string) => void;
  startEditing: () => void;
  stopEditing: () => void;
  save: () => Promise<void>;
  revert: () => void;
  exportMarkdown: () => string;
  exportHTML: () => string;
  exportDocx: () => Promise<Blob>;
}

export interface ChapterWriteLayoutProps {
  storyId: string;
  chapterNumber: number;
}

export interface ChapterChatPanelProps {
  storyId: string;
  chapterNumber: number;
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
  generationHistory: ChapterGenerationHistory[];
  error: string | null;
}

export interface ChapterViewerPanelProps {
  storyId: string;
  chapterNumber: number;
  content: string;
  onSave: (content: string) => void;
  onEdit: (content: string) => void;
  isSaving: boolean;
  isEditing: boolean;
  lastSaved: Date | null;
  wordCount: number;
}

export interface ChapterPromptInputProps {
  onSubmit: (prompt: string) => void;
  disabled: boolean;
  placeholder?: string;
  className?: string;
}

export interface ChapterContentDisplayProps {
  content: string;
  isEditing: boolean;
  onContentChange: (content: string) => void;
  wordCount: number;
}