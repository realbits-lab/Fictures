'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Sparkles, 
  Lightbulb, 
  Check, 
  X,
  Settings,
  Wand2,
  MessageSquare,
  Eye,
  Heart,
  Zap
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';

interface Suggestion {
  id: string;
  type: 'continuation' | 'dialogue' | 'description' | 'action' | 'emotion';
  text: string;
  confidence: number;
  reasoning?: string;
}

interface GrammarIssue {
  id: string;
  type: 'grammar' | 'style';
  text: string;
  position: { start: number; end: number };
  description: string;
  suggestion: string;
}

interface AIWritingAssistantProps {
  storyId: string;
  chapterId?: string;
  onTextChange?: (text: string) => void;
}

export function AIWritingAssistant({ storyId, chapterId, onTextChange }: AIWritingAssistantProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [suggestionType, setSuggestionType] = useState<string>('continuation');
  const [creativity, setCreativity] = useState([75]);
  const [contextLength, setContextLength] = useState([500]);
  const [currentText, setCurrentText] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [grammarIssues, setGrammarIssues] = useState<GrammarIssue[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mock suggestions for demo
  const mockSuggestions: Suggestion[] = [
    {
      id: '1',
      type: 'continuation',
      text: ' a sense of unease creeping through the shadows of the ancient forest.',
      confidence: 92,
      reasoning: 'This continuation maintains the atmospheric tension and builds on the emotional setup.'
    },
    {
      id: '2',
      type: 'continuation',
      text: ' anticipation mixed with fear as the unknown stretched before them.',
      confidence: 87,
      reasoning: 'Creates emotional depth and forward momentum in the narrative.'
    },
    {
      id: '3',
      type: 'continuation',
      text: ' the weight of destiny pressing down like a heavy cloak.',
      confidence: 79,
      reasoning: 'Adds metaphorical depth and connects to larger story themes.'
    }
  ];

  const mockGrammarIssues: GrammarIssue[] = [
    {
      id: '1',
      type: 'grammar',
      text: 'threw',
      position: { start: 75, end: 80 },
      description: 'Incorrect word usage',
      suggestion: 'through'
    },
    {
      id: '2',
      type: 'style',
      text: 'very unique',
      position: { start: 25, end: 36 },
      description: 'Redundant modifier - "unique" is absolute',
      suggestion: 'unique'
    }
  ];

  useEffect(() => {
    if (currentText.length > 10) {
      setIsAnalyzing(true);
      // Simulate AI analysis delay
      const timer = setTimeout(() => {
        setSuggestions(mockSuggestions);
        setGrammarIssues(mockGrammarIssues);
        setShowSuggestions(true);
        setIsAnalyzing(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentText]);

  const handleTextChange = (text: string) => {
    setCurrentText(text);
    onTextChange?.(text);
  };

  const applySuggestion = (suggestion: Suggestion) => {
    const newText = currentText + suggestion.text;
    setCurrentText(newText);
    onTextChange?.(newText);
    setShowSuggestions(false);
  };

  const applyGrammarFix = (issue: GrammarIssue) => {
    const newText = 
      currentText.substring(0, issue.position.start) +
      issue.suggestion +
      currentText.substring(issue.position.end);
    setCurrentText(newText);
    onTextChange?.(newText);
    setGrammarIssues(prev => prev.filter(i => i.id !== issue.id));
  };

  const getSuggestionTypeIcon = (type: string) => {
    switch (type) {
      case 'dialogue': return <MessageSquare className="h-4 w-4" />;
      case 'description': return <Eye className="h-4 w-4" />;
      case 'action': return <Zap className="h-4 w-4" />;
      case 'emotion': return <Heart className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6" data-testid="story-writing-interface">
      {/* AI Assistant Panel */}
      <Card data-testid="ai-assistant-panel">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI Writing Assistant</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEnabled(!isEnabled)}
              data-testid="ai-toggle-button"
            >
              {isEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Suggestion Type Selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Suggestion Type</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="ai-suggestion-type-selector">
                  {getSuggestionTypeIcon(suggestionType)}
                  <span className="ml-2 capitalize">{suggestionType}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem 
                  onClick={() => setSuggestionType('continuation')}
                  data-testid="suggestion-type-continuation"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Story Continuation
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSuggestionType('dialogue')}
                  data-testid="suggestion-type-dialogue"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Dialogue Enhancement
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSuggestionType('description')}
                  data-testid="suggestion-type-description"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Scene Description
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSuggestionType('action')}
                  data-testid="suggestion-type-action"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Action Sequences
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSuggestionType('emotion')}
                  data-testid="suggestion-type-emotion"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Emotional Depth
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Creativity Slider */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Creativity Level: {creativity[0]}%
            </label>
            <Slider
              value={creativity}
              onValueChange={setCreativity}
              max={100}
              step={5}
              data-testid="ai-creativity-slider"
            />
          </div>

          {/* Context Length Slider */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Context Length: {contextLength[0]} words
            </label>
            <Slider
              value={contextLength}
              onValueChange={setContextLength}
              min={100}
              max={1000}
              step={50}
              data-testid="ai-context-length-slider"
            />
          </div>
        </CardContent>
      </Card>

      {/* Chapter Editor */}
      <Card data-testid="chapter-editor">
        <CardHeader>
          <CardTitle>Chapter Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Textarea
              value={currentText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Start writing your story..."
              className="min-h-[400px] font-mono"
              data-testid="text-editor-content"
            />
            
            {/* Grammar/Style Highlights */}
            {grammarIssues.map((issue) => (
              <div
                key={issue.id}
                className="absolute bg-red-200 opacity-50 pointer-events-none"
                style={{
                  left: '12px',
                  top: `${50 + Math.floor(issue.position.start / 50) * 20}px`,
                  width: `${(issue.position.end - issue.position.start) * 8}px`,
                  height: '20px',
                }}
                data-testid={issue.type === 'grammar' ? 'grammar-highlight' : 'style-highlight'}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions Overlay */}
      {showSuggestions && isEnabled && (
        <Card className="fixed right-4 top-1/2 transform -translate-y-1/2 w-96 z-50" data-testid="ai-suggestion-overlay">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5" />
                <span>AI Suggestions</span>
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowSuggestions(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="border rounded-lg p-3" data-testid="ai-suggestion">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {suggestion.type}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500" data-testid="suggestion-confidence">
                      {suggestion.confidence}% confident
                    </span>
                  </div>
                </div>
                
                <p className="text-sm mb-3" data-testid="suggestion-text">
                  {suggestion.text}
                </p>
                
                {suggestion.reasoning && (
                  <p className="text-xs text-gray-600 mb-3">
                    {suggestion.reasoning}
                  </p>
                )}
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => applySuggestion(suggestion)}
                    data-testid="accept-suggestion-button"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid="reject-suggestion-button"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Grammar/Style Suggestions Tooltip */}
      {grammarIssues.length > 0 && (
        <Card className="fixed bottom-4 right-4 w-80 z-40" data-testid="grammar-suggestion-tooltip">
          <CardHeader>
            <CardTitle className="text-sm">Writing Issues Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {grammarIssues.map((issue) => (
              <div key={issue.id} className="border rounded-lg p-2">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant={issue.type === 'grammar' ? 'destructive' : 'secondary'}>
                    {issue.type}
                  </Badge>
                </div>
                
                <p className="text-sm mb-1" data-testid="issue-description">
                  {issue.description}
                </p>
                
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs text-gray-500">"{issue.text}" →</span>
                  <span className="text-xs text-green-600" data-testid="suggested-correction">
                    "{issue.suggestion}"
                  </span>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => applyGrammarFix(issue)}
                  data-testid="apply-correction-button"
                >
                  Apply Fix
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Dialogue Enhancement Modal */}
      <div className="hidden" data-testid="dialogue-enhancement-suggestions">
        <div data-testid="add-dialogue-tags">Add Dialogue Tags</div>
        <div data-testid="improve-speech-patterns">Improve Speech Patterns</div>
        <div data-testid="add-subtext">Add Subtext</div>
        <div data-testid="enhance-character-voice">Enhance Character Voice</div>
      </div>

      {/* Context Menu for Scene Enhancement */}
      <div className="hidden" data-testid="editor-context-menu">
        <div data-testid="enhance-scene-description">Enhance Scene Description</div>
      </div>

      {/* Scene Enhancement Modal */}
      <div className="hidden" data-testid="scene-enhancement-modal">
        <div data-testid="add-sensory-details">Add Sensory Details</div>
        <div data-testid="improve-atmosphere">Improve Atmosphere</div>
        <div data-testid="add-visual-descriptions">Add Visual Descriptions</div>
        <div data-testid="enhance-mood">Enhance Mood</div>
        
        <select data-testid="mood-selector">
          <option value="mysterious" data-testid="mood-mysterious">Mysterious</option>
          <option value="tense">Tense</option>
          <option value="peaceful">Peaceful</option>
        </select>
        
        <Button data-testid="apply-scene-enhancements">Apply Enhancements</Button>
      </div>
    </div>
  );
}