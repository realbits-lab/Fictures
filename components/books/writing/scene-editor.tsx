'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Save, Clock, Eye, EyeOff, BookOpen, User, MapPin, Sun, Users, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { SceneEditorProps, EditorState } from '../types/hierarchy';
import debounce from 'lodash/debounce';

interface SceneData {
  id: string;
  chapterId: string;
  sceneNumber: number;
  title: string;
  content: string;
  wordCount: number;
  order: number;
  sceneType: 'action' | 'dialogue' | 'exposition' | 'climax' | 'resolution';
  pov?: string;
  location?: string;
  timeOfDay?: string;
  charactersPresent?: string[];
  mood?: string;
  purpose?: string;
  conflict?: string;
  resolution?: string;
  hooks?: string[];
  beats?: string[];
  isComplete: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const SceneEditor: React.FC<SceneEditorProps> = ({
  bookId,
  storyId,
  partId,
  chapterId,
  sceneId,
  initialContent,
  className,
  onSave,
  onAutoSave
}) => {
  const [sceneData, setSceneData] = useState<SceneData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<EditorState>({
    content: initialContent || '',
    wordCount: 0,
    isDirty: false,
    isLoading: false
  });
  const [showMetadata, setShowMetadata] = useState(false);
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: editorState.content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      const text = editor.getText();
      const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
      
      setEditorState(prev => ({
        ...prev,
        content,
        wordCount,
        isDirty: true
      }));

      // Trigger auto-save after 2 seconds of inactivity
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave(content);
      }, 2000);
    },
    editorProps: {
      attributes: {
        'data-testid': 'editor-content',
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-96 p-4'
      }
    }
  });

  // Fetch scene data
  const fetchSceneData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/books/${bookId}/stories/${storyId}/parts/${partId}/chapters/${chapterId}/scenes/${sceneId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load scene data');
      }
      
      const data = await response.json();
      setSceneData(data.scene);
      
      if (data.scene.content && editor) {
        editor.commands.setContent(data.scene.content);
      }
      
      setEditorState(prev => ({
        ...prev,
        content: data.scene.content || '',
        wordCount: data.scene.wordCount || 0,
        isDirty: false
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scene');
    } finally {
      setLoading(false);
    }
  }, [bookId, storyId, partId, chapterId, sceneId, editor]);

  useEffect(() => {
    fetchSceneData();
  }, [fetchSceneData]);

  // Auto-save handler
  const handleAutoSave = useCallback(async (content: string) => {
    if (!sceneData || !content.trim()) return;

    try {
      onAutoSave?.(content);
      
      await fetch(
        `/api/books/${bookId}/stories/${storyId}/parts/${partId}/chapters/${chapterId}/scenes/${sceneId}/auto-save`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        }
      );
      
      setEditorState(prev => ({
        ...prev,
        lastSaved: new Date(),
        isDirty: false
      }));
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [bookId, storyId, partId, chapterId, sceneId, sceneData, onAutoSave]);

  // Manual save handler
  const handleSave = useCallback(async () => {
    if (!sceneData || !editor) return;

    try {
      setSaving(true);
      const content = editor.getHTML();
      
      const response = await fetch(
        `/api/books/${bookId}/stories/${storyId}/parts/${partId}/chapters/${chapterId}/scenes/${sceneId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...sceneData,
            content,
            wordCount: editorState.wordCount
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to save scene');
      }
      
      const updatedScene = await response.json();
      setSceneData(updatedScene.scene);
      setEditorState(prev => ({
        ...prev,
        isDirty: false,
        lastSaved: new Date()
      }));
      
      onSave?.(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save scene');
    } finally {
      setSaving(false);
    }
  }, [bookId, storyId, partId, chapterId, sceneId, sceneData, editor, editorState.wordCount, onSave]);

  // Update scene metadata
  const updateSceneMetadata = useCallback(async (updates: Partial<SceneData>) => {
    if (!sceneData) return;

    try {
      const response = await fetch(
        `/api/books/${bookId}/stories/${storyId}/parts/${partId}/chapters/${chapterId}/scenes/${sceneId}/metadata`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        }
      );
      
      if (response.ok) {
        const updatedScene = await response.json();
        setSceneData(updatedScene.scene);
      }
    } catch (error) {
      console.error('Failed to update metadata:', error);
    }
  }, [bookId, storyId, partId, chapterId, sceneId, sceneData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
        e.preventDefault();
        setShowMetadata(!showMetadata);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, showMetadata]);

  // Cleanup auto-save timeout
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Format last saved time
  const formatLastSaved = useCallback((date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    return date.toLocaleTimeString();
  }, []);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div data-testid="scene-editor-loading" className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading scene editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div data-testid="scene-editor-error" className="text-center">
          <p className="text-sm text-red-600 mb-4">Failed to load scene editor</p>
          <Button onClick={fetchSceneData} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!sceneData) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div data-testid="scene-not-found" className="text-center">
          <p className="text-sm text-gray-500">Scene not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Toolbar */}
      <div 
        data-testid="scene-editor-toolbar"
        className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10"
      >
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-semibold">{sceneData.title}</h1>
            <p className="text-sm text-gray-500">
              Scene {sceneData.sceneNumber} • {editorState.wordCount} words
            </p>
          </div>
          <Badge variant={sceneData.isComplete ? 'default' : 'secondary'}>
            {sceneData.isComplete ? 'Complete' : 'Draft'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {editorState.lastSaved && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Saved {formatLastSaved(editorState.lastSaved)}
            </span>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            data-testid="toggle-metadata"
            onClick={() => setShowMetadata(!showMetadata)}
          >
            {showMetadata ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            Metadata
          </Button>
          
          <Button
            data-testid="save-scene"
            onClick={handleSave}
            disabled={saving || !editorState.isDirty}
            size="sm"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main editor */}
        <div className="flex-1 flex flex-col">
          <div data-testid="scene-editor-content" className="flex-1 overflow-auto">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Metadata sidebar */}
        {showMetadata && (
          <div className="w-80 border-l bg-gray-50 overflow-auto">
            <div className="p-4">
              <h3 className="font-semibold mb-4">Scene Metadata</h3>
              
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="structure">Structure</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="scene-type">Scene Type</Label>
                    <Select
                      value={sceneData.sceneType}
                      onValueChange={(value) => updateSceneMetadata({ sceneType: value as any })}
                    >
                      <SelectTrigger data-testid="scene-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="action">Action</SelectItem>
                        <SelectItem value="dialogue">Dialogue</SelectItem>
                        <SelectItem value="exposition">Exposition</SelectItem>
                        <SelectItem value="climax">Climax</SelectItem>
                        <SelectItem value="resolution">Resolution</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="pov">Point of View</Label>
                    <Input
                      id="pov"
                      data-testid="pov-input"
                      value={sceneData.pov || ''}
                      onChange={(e) => updateSceneMetadata({ pov: e.target.value })}
                      placeholder="e.g., First person, Third person limited"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      data-testid="location-input"
                      value={sceneData.location || ''}
                      onChange={(e) => updateSceneMetadata({ location: e.target.value })}
                      placeholder="Where does this scene take place?"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="time-of-day">Time of Day</Label>
                    <Input
                      id="time-of-day"
                      data-testid="time-input"
                      value={sceneData.timeOfDay || ''}
                      onChange={(e) => updateSceneMetadata({ timeOfDay: e.target.value })}
                      placeholder="e.g., Dawn, Midday, Evening"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="mood">Mood/Atmosphere</Label>
                    <Input
                      id="mood"
                      data-testid="mood-input"
                      value={sceneData.mood || ''}
                      onChange={(e) => updateSceneMetadata({ mood: e.target.value })}
                      placeholder="e.g., Tense, Peaceful, Mysterious"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="structure" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="purpose">Scene Purpose</Label>
                    <Textarea
                      id="purpose"
                      data-testid="purpose-textarea"
                      value={sceneData.purpose || ''}
                      onChange={(e) => updateSceneMetadata({ purpose: e.target.value })}
                      placeholder="What is this scene trying to accomplish?"
                      className="min-h-20"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="conflict">Conflict</Label>
                    <Textarea
                      id="conflict"
                      data-testid="conflict-textarea"
                      value={sceneData.conflict || ''}
                      onChange={(e) => updateSceneMetadata({ conflict: e.target.value })}
                      placeholder="What tension or problem drives this scene?"
                      className="min-h-20"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="resolution">Resolution</Label>
                    <Textarea
                      id="resolution"
                      data-testid="resolution-textarea"
                      value={sceneData.resolution || ''}
                      onChange={(e) => updateSceneMetadata({ resolution: e.target.value })}
                      placeholder="How is the conflict resolved?"
                      className="min-h-20"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="notes" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="notes">Writer Notes</Label>
                    <Textarea
                      id="notes"
                      data-testid="notes-textarea"
                      value={sceneData.notes || ''}
                      onChange={(e) => updateSceneMetadata({ notes: e.target.value })}
                      placeholder="Notes, ideas, and reminders for this scene..."
                      className="min-h-32"
                    />
                  </div>
                  
                  <div>
                    <Label>Scene Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="checkbox"
                        id="is-complete"
                        data-testid="complete-checkbox"
                        checked={sceneData.isComplete}
                        onChange={(e) => updateSceneMetadata({ isComplete: e.target.checked })}
                      />
                      <Label htmlFor="is-complete" className="text-sm">
                        Mark as complete
                      </Label>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
      
      {/* Status bar */}
      <div className="border-t bg-gray-50 px-4 py-2 text-xs text-gray-500 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>{editorState.wordCount} words</span>
          {editorState.isDirty && (
            <span className="text-orange-500">• Unsaved changes</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>Cmd+S to save</span>
          <span>•</span>
          <span>Cmd+M to toggle metadata</span>
        </div>
      </div>
    </div>
  );
};

export default SceneEditor;