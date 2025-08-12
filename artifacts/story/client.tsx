import { Artifact } from '@/components/create-artifact';
import { DiffView } from '@/components/diffview';
import { DocumentSkeleton } from '@/components/document-skeleton';
import { Editor } from '@/components/text-editor';
import {
  ClockRewind,
  CopyIcon,
  MessageIcon,
  PenIcon,
  RedoIcon,
  UndoIcon,
  BookOpenIcon,
} from '@/components/icons';
import type { Suggestion } from '@/lib/db/schema';
import { toast } from 'sonner';
import { getSuggestions } from '../actions';

interface StoryMetadata {
  title?: string;
  description?: string;
  genre?: string;
  status?: string;
  tags?: string[];
}

interface StoryArtifactMetadata {
  suggestions: Array<Suggestion>;
  storyMetadata?: StoryMetadata;
}

export const storyArtifact = new Artifact<'story', StoryArtifactMetadata>({
  kind: 'story',
  description: 'Create and edit stories with metadata like genre, tags, and status.',
  initialize: async ({ documentId, setMetadata }) => {
    const suggestions = await getSuggestions({ documentId });

    setMetadata({
      suggestions,
    });
  },
  onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
    if (streamPart.type === 'data-suggestion') {
      setMetadata((metadata) => {
        return {
          suggestions: [...metadata.suggestions, streamPart.data],
        };
      });
    }

    if (streamPart.type === 'data-storyMetadata') {
      setMetadata((metadata) => {
        return {
          ...metadata,
          storyMetadata: streamPart.data,
        };
      });
    }

    if (streamPart.type === 'data-textDelta') {
      setArtifact((draftArtifact) => {
        return {
          ...draftArtifact,
          content: draftArtifact.content + streamPart.data,
          isVisible:
            draftArtifact.status === 'streaming' &&
            draftArtifact.content.length > 400 &&
            draftArtifact.content.length < 450
              ? true
              : draftArtifact.isVisible,
        };
      });
    }
  },
  render: ({
    artifact,
    metadata,
    renderArtifactActions,
    renderVersionFooter,
    renderArtifactMessages,
    onSubmitMessage,
    handleDuplicate,
    handleShare,
    handleVote,
    isReadonly,
    messages,
    isLoading,
    onClickMessage,
    setCurrentVersionIndex,
    currentVersionIndex,
    versions,
  }) => {
    if (!artifact) {
      return (
        <div className="text-muted-foreground h-full flex flex-col">
          <div className="flex flex-row justify-between items-start">
            <div className="flex flex-row gap-2 items-center text-sm">
              <BookOpenIcon size={16} />
              <span>Story</span>
            </div>
            {renderArtifactActions}
          </div>
          <div className="prose flex-1 flex flex-col">
            <DocumentSkeleton />
          </div>
          {renderVersionFooter}
        </div>
      );
    }

    const { storyMetadata } = metadata;
    
    return (
      <div className="text-muted-foreground h-full flex flex-col">
        <div className="flex flex-row justify-between items-start">
          <div className="flex flex-row gap-2 items-center text-sm">
            <BookOpenIcon size={16} />
            <span>Story</span>
          </div>
          {renderArtifactActions}
        </div>

        {/* Story Metadata Display */}
        {storyMetadata && (
          <div className="border-b border-border pb-4 mb-4 space-y-2">
            <h2 className="font-semibold text-foreground">{storyMetadata.title}</h2>
            {storyMetadata.description && (
              <p className="text-sm text-muted-foreground">{storyMetadata.description}</p>
            )}
            <div className="flex flex-wrap gap-2 items-center text-xs">
              {storyMetadata.genre && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                  {storyMetadata.genre}
                </span>
              )}
              {storyMetadata.status && (
                <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full">
                  {storyMetadata.status}
                </span>
              )}
              {storyMetadata.tags && storyMetadata.tags.length > 0 && (
                <div className="flex gap-1 items-center">
                  <BookOpenIcon size={12} />
                  {storyMetadata.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-accent text-accent-foreground rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Story Content Editor */}
        <div className="prose flex-1 flex flex-col">
          <Editor
            content={artifact.content}
            identifier={`${artifact.documentId}-${artifact.kind}-${currentVersionIndex}`}
            placeholder="Start writing your story..."
            saveTrigger={
              <button className="text-muted-foreground cursor-pointer hover:text-foreground">
                <PenIcon size={14} />
              </button>
            }
            readonly={isReadonly}
            suggestions={metadata.suggestions}
            className="flex-1"
          />
        </div>
        {renderVersionFooter}
        {renderArtifactMessages}
      </div>
    );
  },
});