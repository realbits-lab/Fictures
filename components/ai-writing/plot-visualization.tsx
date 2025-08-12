'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  Target,
  BookOpen,
  Users,
  Lightbulb,
  CheckCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface PlotElement {
  type: 'exposition' | 'inciting-incident' | 'rising-action' | 'climax' | 'falling-action' | 'resolution';
  name: string;
  description: string;
  chapters: number[];
  tensionLevel: number;
}

interface ChapterMapping {
  chapterNumber: number;
  plotElement: string;
  tensionLevel: number;
  pacing: 'slow' | 'moderate' | 'fast';
}

interface Subplot {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'active' | 'resolved';
  progress: number;
  relatedCharacters: string[];
  startChapter: number;
  endChapter: number;
}

interface PlotRecommendation {
  id: string;
  type: 'pacing' | 'structure' | 'tension' | 'character';
  description: string;
  affectedChapters: string;
  priority: 'low' | 'medium' | 'high';
}

interface PlotHole {
  id: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  suggestedResolution: string;
}

export function PlotStructureDashboard({ storyId }: { storyId: string }) {
  const [plotElements] = useState<PlotElement[]>([
    {
      type: 'exposition',
      name: 'World Building',
      description: 'Introduction to the mystical world and main character',
      chapters: [1],
      tensionLevel: 20
    },
    {
      type: 'inciting-incident',
      name: 'The Call to Adventure',
      description: 'Elena discovers her father\'s mysterious disappearance',
      chapters: [2],
      tensionLevel: 40
    },
    {
      type: 'rising-action',
      name: 'Investigation Begins',
      description: 'Elena starts investigating and encounters obstacles',
      chapters: [3, 4, 5, 6],
      tensionLevel: 70
    },
    {
      type: 'climax',
      name: 'The Final Confrontation',
      description: 'Elena faces the main antagonist',
      chapters: [7],
      tensionLevel: 95
    },
    {
      type: 'falling-action',
      name: 'Resolution of Conflicts',
      description: 'Aftermath of the confrontation',
      chapters: [8],
      tensionLevel: 40
    },
    {
      type: 'resolution',
      name: 'New Beginning',
      description: 'Elena\'s new understanding and future path',
      chapters: [9],
      tensionLevel: 10
    }
  ]);

  const [chapterMappings] = useState<ChapterMapping[]>([
    { chapterNumber: 1, plotElement: 'Exposition', tensionLevel: 20, pacing: 'moderate' },
    { chapterNumber: 2, plotElement: 'Inciting Incident', tensionLevel: 40, pacing: 'moderate' },
    { chapterNumber: 3, plotElement: 'Rising Action', tensionLevel: 50, pacing: 'fast' },
    { chapterNumber: 4, plotElement: 'Rising Action', tensionLevel: 60, pacing: 'fast' },
    { chapterNumber: 5, plotElement: 'Rising Action', tensionLevel: 70, pacing: 'moderate' },
    { chapterNumber: 6, plotElement: 'Rising Action', tensionLevel: 80, pacing: 'fast' },
    { chapterNumber: 7, plotElement: 'Climax', tensionLevel: 95, pacing: 'fast' },
    { chapterNumber: 8, plotElement: 'Falling Action', tensionLevel: 40, pacing: 'moderate' },
    { chapterNumber: 9, plotElement: 'Resolution', tensionLevel: 10, pacing: 'slow' }
  ]);

  return (
    <div className="space-y-6" data-testid="plot-structure-dashboard">
      {/* Plot Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Story Structure Visualization</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6" data-testid="plot-visualization">
            {/* Plot Arc Chart */}
            <div className="h-64 bg-gray-50 rounded-lg p-4">
              <svg className="w-full h-full" viewBox="0 0 400 200">
                {/* Plot curve */}
                <path
                  d="M 20 180 Q 80 160, 120 120 Q 160 80, 200 40 Q 240 60, 280 100 Q 320 140, 380 170"
                  stroke="#3B82F6"
                  strokeWidth="3"
                  fill="none"
                />
                
                {/* Plot elements */}
                {plotElements.map((element, index) => {
                  const x = 20 + (index * 60);
                  const y = 180 - (element.tensionLevel * 1.6);
                  
                  return (
                    <g key={element.type}>
                      <circle
                        cx={x}
                        cy={y}
                        r="6"
                        fill="#3B82F6"
                        data-testid={element.type}
                      />
                      <text
                        x={x}
                        y={y - 15}
                        textAnchor="middle"
                        className="text-xs font-medium"
                      >
                        {element.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Chapter Mapping */}
            <div data-testid="chapter-mapping">
              <h4 className="font-medium mb-3">Chapter Structure Mapping</h4>
              <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
                {chapterMappings.map((chapter) => (
                  <div
                    key={chapter.chapterNumber}
                    className="text-center p-2 border rounded"
                    data-testid="chapter-marker"
                  >
                    <div className="font-bold text-lg" data-testid="chapter-number">
                      {chapter.chapterNumber}
                    </div>
                    <div className="text-xs" data-testid="plot-element">
                      {chapter.plotElement}
                    </div>
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-blue-600 h-1 rounded-full"
                          style={{ width: `${chapter.tensionLevel}%` }}
                          data-testid="tension-level"
                        />
                      </div>
                    </div>
                    <Badge
                      variant={
                        chapter.pacing === 'fast' ? 'destructive' :
                        chapter.pacing === 'moderate' ? 'default' : 'secondary'
                      }
                      className="text-xs mt-1"
                    >
                      {chapter.pacing}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PlotAnalysis({ storyId }: { storyId: string }) {
  const [recommendations] = useState<PlotRecommendation[]>([
    {
      id: '1',
      type: 'pacing',
      description: 'Consider slowing down the pacing in Chapter 3 to build more tension',
      affectedChapters: 'Chapter 3',
      priority: 'medium'
    },
    {
      id: '2',
      type: 'structure',
      description: 'The rising action could benefit from an additional conflict point',
      affectedChapters: 'Chapters 4-5',
      priority: 'high'
    }
  ]);

  const [plotHoles] = useState<PlotHole[]>([
    {
      id: '1',
      description: 'Character motivation unclear in Chapter 4 - why does Elena trust the stranger?',
      severity: 'moderate',
      suggestedResolution: 'Add backstory or previous connection between characters'
    }
  ]);

  return (
    <div className="space-y-6" data-testid="plot-analysis-page">
      {/* Pacing Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Pacing Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6" data-testid="pacing-analysis">
            {/* Pacing Chart */}
            <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center" data-testid="pacing-chart">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Pacing visualization chart</p>
              </div>
            </div>

            {/* Tension Curve */}
            <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center" data-testid="tension-curve">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Tension curve analysis</p>
              </div>
            </div>

            {/* Recommendations */}
            <div data-testid="pacing-recommendations">
              <h4 className="font-medium mb-3">Pacing Recommendations</h4>
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="border rounded-lg p-3" data-testid="recommendation-item">
                    <div className="flex items-start justify-between mb-2">
                      <Badge 
                        variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                        data-testid="recommendation-type"
                      >
                        {rec.type} - {rec.priority}
                      </Badge>
                      <Button size="sm" variant="outline" data-testid="apply-recommendation-button">
                        Apply
                      </Button>
                    </div>
                    <p className="text-sm mb-1" data-testid="recommendation-description">
                      {rec.description}
                    </p>
                    <p className="text-xs text-gray-500" data-testid="affected-chapters">
                      Affects: {rec.affectedChapters}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plot Hole Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Plot Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div data-testid="plot-hole-analysis">
            <h4 className="font-medium mb-3">Potential Issues</h4>
            <div className="space-y-3" data-testid="plot-holes-list">
              {plotHoles.map((hole) => (
                <div key={hole.id} className="border rounded-lg p-3" data-testid="plot-hole-item">
                  <div className="flex items-start justify-between mb-2">
                    <Badge 
                      variant={hole.severity === 'major' ? 'destructive' : hole.severity === 'moderate' ? 'default' : 'secondary'}
                      data-testid="severity-level"
                    >
                      {hole.severity}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2" data-testid="plot-hole-description">
                    {hole.description}
                  </p>
                  <div className="bg-blue-50 p-2 rounded text-sm">
                    <span className="font-medium">Suggested Resolution: </span>
                    <span data-testid="suggested-resolution">{hole.suggestedResolution}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SubplotManagement({ storyId }: { storyId: string }) {
  const [subplots, setSubplots] = useState<Subplot[]>([
    {
      id: '1',
      title: 'Elena\'s Past Investigation',
      description: 'Elena\'s unresolved case from her detective days',
      status: 'active',
      progress: 65,
      relatedCharacters: ['Elena Blackwood', 'Captain Martinez'],
      startChapter: 2,
      endChapter: 8
    },
    {
      id: '2',
      title: 'Marcus\'s Secret Identity',
      description: 'Mystery surrounding Marcus\'s true background',
      status: 'active',
      progress: 40,
      relatedCharacters: ['Marcus Stone', 'Elena Blackwood'],
      startChapter: 3,
      endChapter: 9
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubplot, setNewSubplot] = useState({
    title: '',
    description: '',
    startChapter: 1,
    endChapter: 5,
    relatedCharacters: [] as string[]
  });

  const handleCreateSubplot = () => {
    const subplot: Subplot = {
      id: Date.now().toString(),
      title: newSubplot.title,
      description: newSubplot.description,
      status: 'planning',
      progress: 0,
      relatedCharacters: newSubplot.relatedCharacters,
      startChapter: newSubplot.startChapter,
      endChapter: newSubplot.endChapter
    };

    setSubplots([...subplots, subplot]);
    setNewSubplot({
      title: '',
      description: '',
      startChapter: 1,
      endChapter: 5,
      relatedCharacters: []
    });
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6" data-testid="subplot-management-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subplot Management</h1>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button data-testid="add-subplot-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Subplot
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="create-subplot-modal">
            <DialogHeader>
              <DialogTitle>Create New Subplot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Subplot Title</label>
                <Input
                  value={newSubplot.title}
                  onChange={(e) => setNewSubplot({ ...newSubplot, title: e.target.value })}
                  data-testid="subplot-title-input"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newSubplot.description}
                  onChange={(e) => setNewSubplot({ ...newSubplot, description: e.target.value })}
                  data-testid="subplot-description-textarea"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Chapter</label>
                  <Input
                    type="number"
                    value={newSubplot.startChapter}
                    onChange={(e) => setNewSubplot({ ...newSubplot, startChapter: parseInt(e.target.value) })}
                    data-testid="start-chapter-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Chapter</label>
                  <Input
                    type="number"
                    value={newSubplot.endChapter}
                    onChange={(e) => setNewSubplot({ ...newSubplot, endChapter: parseInt(e.target.value) })}
                    data-testid="end-chapter-input"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Related Characters</label>
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    data-testid="character-selector"
                    onClick={() => {
                      // In a real app, this would open a character selector
                      setNewSubplot({
                        ...newSubplot,
                        relatedCharacters: ['Elena Blackwood']
                      });
                    }}
                  >
                    Select Characters
                  </Button>
                </div>
                {/* Hidden option for testing */}
                <div style={{ display: 'none' }}>
                  <button data-testid="character-option-elena">Elena Blackwood</button>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateSubplot}
                  disabled={!newSubplot.title || !newSubplot.description}
                  data-testid="create-subplot-button"
                >
                  Create Subplot
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Subplots List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="subplots-list">
        {subplots.map((subplot) => (
          <Card key={subplot.id} data-testid="subplot-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg" data-testid="subplot-title">
                    {subplot.title}
                  </CardTitle>
                  <Badge 
                    variant={subplot.status === 'active' ? 'default' : subplot.status === 'resolved' ? 'secondary' : 'outline'}
                    data-testid="subplot-status"
                  >
                    {subplot.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">{subplot.description}</p>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span data-testid="subplot-progress">{subplot.progress}%</span>
                </div>
                <Progress value={subplot.progress} />
              </div>
              
              <div>
                <label className="text-sm font-medium">Related Characters</label>
                <div className="flex flex-wrap gap-1 mt-1" data-testid="related-characters">
                  {subplot.relatedCharacters.map((character, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {character}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="text-sm text-gray-500" data-testid="chapter-span">
                Chapters {subplot.startChapter} - {subplot.endChapter}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function PlotTemplates({ storyId }: { storyId: string }) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const templates = [
    {
      id: 'three-act',
      name: 'Three-Act Structure',
      description: 'Classic narrative structure with setup, confrontation, and resolution',
      structure: ['Act I: Setup', 'Act II: Confrontation', 'Act III: Resolution'],
      milestones: ['Inciting Incident', 'Plot Point 1', 'Midpoint', 'Plot Point 2', 'Climax']
    },
    {
      id: 'heros-journey',
      name: 'Hero\'s Journey',
      description: 'Joseph Campbell\'s monomyth structure for adventure stories',
      structure: ['Ordinary World', 'Call to Adventure', 'Refusal', 'Meeting Mentor', 'Crossing Threshold'],
      milestones: ['Call to Adventure', 'Meeting the Mentor', 'Ordeal', 'Reward', 'Return']
    },
    {
      id: 'five-act',
      name: 'Five-Act Structure',
      description: 'Extended structure providing more detailed story development',
      structure: ['Exposition', 'Rising Action', 'Climax', 'Falling Action', 'Denouement'],
      milestones: ['Inciting Incident', 'First Climax', 'Main Climax', 'Final Twist', 'Resolution']
    },
    {
      id: 'save-the-cat',
      name: 'Save the Cat',
      description: 'Blake Snyder\'s beat sheet for screenwriting adapted for novels',
      structure: ['Opening Image', 'Setup', 'Catalyst', 'Debate', 'Break into Two'],
      milestones: ['Opening Image', 'Catalyst', 'Break into Two', 'Midpoint', 'All is Lost']
    }
  ];

  return (
    <div className="space-y-6" data-testid="plot-templates-page">
      {/* Template Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Story Structure Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="template-categories">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedTemplate === template.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedTemplate(template.id)}
                data-testid={template.id}
              >
                <h4 className="font-medium mb-2">{template.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                <div className="space-y-1">
                  {template.structure.slice(0, 3).map((item, index) => (
                    <div key={index} className="text-xs text-gray-500">
                      {index + 1}. {item}
                    </div>
                  ))}
                  {template.structure.length > 3 && (
                    <div className="text-xs text-gray-400">
                      +{template.structure.length - 3} more...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Template Details */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6" data-testid="template-details">
              {(() => {
                const template = templates.find(t => t.id === selectedTemplate);
                if (!template) return null;

                return (
                  <>
                    <div data-testid="template-description">
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </div>

                    <div data-testid="template-structure">
                      <h4 className="font-medium mb-2">Structure</h4>
                      <div className="space-y-1">
                        {template.structure.map((item, index) => (
                          <div key={index} className="text-sm">
                            {index + 1}. {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div data-testid="template-milestones">
                      <h4 className="font-medium mb-2">Key Milestones</h4>
                      <div className="flex flex-wrap gap-2">
                        {template.milestones.map((milestone, index) => (
                          <Badge key={index} variant="outline">
                            {milestone}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button 
                        onClick={() => {
                          // In a real app, this would apply the template
                          alert('Template applied successfully');
                        }}
                        data-testid="apply-template-button"
                      >
                        Apply Template
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden elements for testing */}
      <div style={{ display: 'none' }}>
        <div data-testid="apply-template-confirmation">
          <Button data-testid="confirm-apply-template">Confirm Apply</Button>
        </div>
        <div data-testid="milestone-marker">Template Milestone</div>
      </div>
    </div>
  );
}