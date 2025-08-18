// Shared TypeScript interfaces for book hierarchy components

export interface Scene {
  id: string;
  chapterId: string;
  title: string;
  sceneNumber: number;
  order: number;
  wordCount: number;
  sceneType: 'action' | 'dialogue' | 'exposition' | 'climax' | 'resolution';
  isComplete: boolean;
  content?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Chapter {
  id: string;
  partId: string;
  title: string;
  chapterNumber: number;
  globalChapterNumber: number;
  order: number;
  wordCount: number;
  sceneCount: number;
  isPublished: boolean;
  scenes: Scene[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Part {
  id: string;
  storyId: string;
  title: string;
  partNumber: number;
  order: number;
  wordCount: number;
  chapterCount: number;
  chapters: Chapter[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Story {
  id: string;
  bookId: string;
  title: string;
  order: number;
  wordCount: number;
  partCount: number;
  isActive: boolean;
  parts: Part[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BookHierarchy {
  bookId: string;
  stories: Story[];
}

export interface HierarchyNode {
  id: string;
  type: 'story' | 'part' | 'chapter' | 'scene';
  title: string;
  level: number;
  isExpanded?: boolean;
  isActive?: boolean;
  wordCount?: number;
  children?: HierarchyNode[];
}

export interface NavigationContext {
  bookId: string;
  storyId?: string;
  partId?: string;
  chapterId?: string;
  sceneId?: string;
}

export interface TreeNodeProps {
  node: HierarchyNode;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
  onExpand: (nodeId: string) => void;
  onCollapse: (nodeId: string) => void;
  level: number;
}

export interface ContentTreeProps {
  bookId: string;
  className?: string;
  onNodeSelect?: (context: NavigationContext) => void;
}

export interface HierarchyBreadcrumbProps {
  bookId: string;
  storyId?: string;
  partId?: string;
  chapterId?: string;
  sceneId?: string;
  className?: string;
}

export interface LevelSwitcherProps {
  currentLevel: 'book' | 'story' | 'part' | 'chapter' | 'scene';
  bookId: string;
  storyId?: string;
  partId?: string;
  chapterId?: string;
  sceneId?: string;
  className?: string;
}

export interface QuickJumpProps {
  bookId: string;
  placeholder?: string;
  className?: string;
}

export interface SceneEditorProps {
  bookId: string;
  storyId: string;
  partId: string;
  chapterId: string;
  sceneId: string;
  initialContent?: string;
  className?: string;
  onSave?: (content: string) => void;
  onAutoSave?: (content: string) => void;
}

export interface AIContextPanelProps {
  bookId: string;
  storyId?: string;
  partId?: string;
  chapterId?: string;
  sceneId?: string;
  className?: string;
  isVisible?: boolean;
  onToggle?: () => void;
}

export interface EditorState {
  content: string;
  wordCount: number;
  isDirty: boolean;
  isLoading: boolean;
  lastSaved?: Date;
}

export interface AIContext {
  bookTitle?: string;
  storyTitle?: string;
  partTitle?: string;
  chapterTitle?: string;
  previousScenes?: Scene[];
  characterProfiles?: any[];
  plotOutline?: string;
  writingStyle?: string;
  currentProgress?: {
    totalWords: number;
    currentChapter: number;
    totalChapters: number;
    completionPercentage: number;
  };
}