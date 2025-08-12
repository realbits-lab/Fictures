'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Users, 
  Plus, 
  Brain, 
  Heart,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  age?: number;
  appearance: string;
  personalityTraits: string[];
  motivation: string;
  fears: string;
  backstory: string;
  consistencyScore: number;
  developmentProgress: number;
}

interface ConsistencyIssue {
  id: string;
  type: 'physical' | 'personality' | 'dialogue' | 'behavior';
  description: string;
  chapterReference: string;
}

interface CharacterSuggestion {
  id: string;
  type: 'character-arc' | 'personality-depth' | 'relationship-development' | 'backstory-expansion';
  description: string;
  reasoning: string;
}

interface Relationship {
  id: string;
  character1: string;
  character2: string;
  type: string;
  strength: number;
  history: string;
  development: string;
}

export function CharacterDevelopmentDashboard({ storyId }: { storyId: string }) {
  const [characters, setCharacters] = useState<Character[]>([
    {
      id: '1',
      name: 'Elena Blackwood',
      role: 'protagonist',
      age: 28,
      appearance: 'Tall with dark hair and piercing green eyes',
      personalityTraits: ['Determined', 'Compassionate', 'Analytical'],
      motivation: 'To uncover the truth about her father\'s disappearance',
      fears: 'Losing those she cares about',
      backstory: 'Former detective turned private investigator',
      consistencyScore: 87,
      developmentProgress: 65
    },
    {
      id: '2',
      name: 'Marcus Stone',
      role: 'supporting',
      age: 35,
      appearance: 'Rugged features with a mysterious scar',
      personalityTraits: ['Loyal', 'Secretive', 'Protective'],
      motivation: 'To redeem his past mistakes',
      fears: 'His dark past being revealed',
      backstory: 'Former military operative with a hidden agenda',
      consistencyScore: 92,
      developmentProgress: 48
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCharacter, setNewCharacter] = useState<Partial<Character>>({
    name: '',
    role: 'supporting',
    personalityTraits: [],
    appearance: '',
    motivation: '',
    fears: '',
    backstory: ''
  });

  const handleCreateCharacter = () => {
    const character: Character = {
      id: Date.now().toString(),
      name: newCharacter.name || '',
      role: newCharacter.role as Character['role'] || 'supporting',
      age: newCharacter.age,
      appearance: newCharacter.appearance || '',
      personalityTraits: newCharacter.personalityTraits || [],
      motivation: newCharacter.motivation || '',
      fears: newCharacter.fears || '',
      backstory: newCharacter.backstory || '',
      consistencyScore: 100,
      developmentProgress: 0
    };

    setCharacters([...characters, character]);
    setNewCharacter({
      name: '',
      role: 'supporting',
      personalityTraits: [],
      appearance: '',
      motivation: '',
      fears: '',
      backstory: ''
    });
    setShowCreateModal(false);
  };

  const addTrait = (trait: string) => {
    if (trait.trim() && !newCharacter.personalityTraits?.includes(trait)) {
      setNewCharacter({
        ...newCharacter,
        personalityTraits: [...(newCharacter.personalityTraits || []), trait]
      });
    }
  };

  return (
    <div className="space-y-6" data-testid="character-development-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Character Development</h1>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button data-testid="add-character-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Character
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" data-testid="create-character-modal">
            <DialogHeader>
              <DialogTitle>Create New Character</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList>
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="physical" data-testid="physical-description-tab">Physical</TabsTrigger>
                <TabsTrigger value="personality" data-testid="personality-tab">Personality</TabsTrigger>
                <TabsTrigger value="background" data-testid="background-tab">Background</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Character Name</label>
                  <Input
                    value={newCharacter.name}
                    onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
                    data-testid="character-name-input"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <select 
                    value={newCharacter.role}
                    onChange={(e) => setNewCharacter({ ...newCharacter, role: e.target.value as Character['role'] })}
                    className="w-full border rounded px-3 py-2"
                    data-testid="character-role-select"
                  >
                    <option value="protagonist" data-testid="role-protagonist">Protagonist</option>
                    <option value="antagonist">Antagonist</option>
                    <option value="supporting">Supporting</option>
                    <option value="minor">Minor</option>
                  </select>
                </div>
              </TabsContent>
              
              <TabsContent value="physical" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Age</label>
                  <Input
                    type="number"
                    value={newCharacter.age || ''}
                    onChange={(e) => setNewCharacter({ ...newCharacter, age: parseInt(e.target.value) || undefined })}
                    data-testid="age-input"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Height</label>
                  <Input data-testid="height-input" placeholder="e.g., 5'8\"" />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Physical Appearance</label>
                  <Textarea
                    value={newCharacter.appearance}
                    onChange={(e) => setNewCharacter({ ...newCharacter, appearance: e.target.value })}
                    data-testid="appearance-textarea"
                    placeholder="Describe the character's physical appearance..."
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Distinctive Features</label>
                  <Input data-testid="distinctive-features-input" placeholder="Scars, tattoos, unique features..." />
                </div>
              </TabsContent>
              
              <TabsContent value="personality" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Personality Traits</label>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Input 
                        placeholder="Add a personality trait..."
                        data-testid="trait-input"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addTrait(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        onClick={() => {
                          const input = document.querySelector('[data-testid="trait-input"]') as HTMLInputElement;
                          if (input) {
                            addTrait(input.value);
                            input.value = '';
                          }
                        }}
                        data-testid="add-trait-button"
                      >
                        Add
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2" data-testid="personality-traits-list">
                      {newCharacter.personalityTraits?.map((trait, index) => (
                        <Badge key={index} variant="secondary">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Primary Motivation</label>
                  <Textarea
                    value={newCharacter.motivation}
                    onChange={(e) => setNewCharacter({ ...newCharacter, motivation: e.target.value })}
                    data-testid="character-motivation-textarea"
                    placeholder="What drives this character?"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Fears</label>
                  <Textarea
                    value={newCharacter.fears}
                    onChange={(e) => setNewCharacter({ ...newCharacter, fears: e.target.value })}
                    data-testid="character-fears-textarea"
                    placeholder="What does this character fear most?"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="background" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Backstory</label>
                  <Textarea
                    value={newCharacter.backstory}
                    onChange={(e) => setNewCharacter({ ...newCharacter, backstory: e.target.value })}
                    data-testid="backstory-textarea"
                    placeholder="Character's background and history..."
                    className="min-h-[120px]"
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCharacter}
                disabled={!newCharacter.name}
                data-testid="save-character-button"
              >
                Create Character
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Characters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="characters-list">
        {characters.map((character) => (
          <Card key={character.id} data-testid="character-card" className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={undefined} alt={character.name} />
                    <AvatarFallback>{character.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold" data-testid="character-name">{character.name}</h3>
                    <Badge variant="outline" data-testid="character-role">
                      {character.role}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Consistency Score</span>
                    <span data-testid="character-consistency-score">{character.consistencyScore}%</span>
                  </div>
                  <Progress value={character.consistencyScore} />
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Development Progress</span>
                    <span data-testid="character-development-progress">{character.developmentProgress}%</span>
                  </div>
                  <Progress value={character.developmentProgress} />
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {character.personalityTraits.slice(0, 3).map((trait, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {trait}
                    </Badge>
                  ))}
                  {character.personalityTraits.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{character.personalityTraits.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function CharacterProfile({ characterId }: { characterId: string }) {
  const [consistencyIssues] = useState<ConsistencyIssue[]>([
    {
      id: '1',
      type: 'physical',
      description: 'Eye color inconsistency: described as blue in Chapter 2, green in Chapter 5',
      chapterReference: 'Chapters 2, 5'
    },
    {
      id: '2',
      type: 'personality',
      description: 'Character acts uncharacteristically aggressive without explanation',
      chapterReference: 'Chapter 7'
    }
  ]);

  const [suggestions] = useState<CharacterSuggestion[]>([
    {
      id: '1',
      type: 'character-arc',
      description: 'Consider developing Elena\'s relationship with her mentor figure',
      reasoning: 'This would add emotional depth and create opportunities for character growth'
    },
    {
      id: '2',
      type: 'backstory-expansion',
      description: 'Explore Elena\'s detective training background',
      reasoning: 'This backstory could explain her investigative skills and add authenticity'
    }
  ]);

  return (
    <div className="space-y-6" data-testid="character-profile-page">
      {/* Consistency Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>Character Consistency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6" data-testid="consistency-dashboard">
            {/* Overall Score */}
            <div className="text-center" data-testid="overall-consistency-score">
              <div className="text-4xl font-bold text-green-600" data-testid="score-value">87%</div>
              <div className="text-sm text-gray-600">Overall Consistency</div>
            </div>

            {/* Consistency Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center" data-testid="physical-consistency">
                <div className="text-xl font-bold text-blue-600">92%</div>
                <div className="text-xs text-gray-600">Physical</div>
              </div>
              <div className="text-center" data-testid="personality-consistency">
                <div className="text-xl font-bold text-green-600">89%</div>
                <div className="text-xs text-gray-600">Personality</div>
              </div>
              <div className="text-center" data-testid="dialogue-consistency">
                <div className="text-xl font-bold text-yellow-600">78%</div>
                <div className="text-xs text-gray-600">Dialogue</div>
              </div>
              <div className="text-center" data-testid="behavior-consistency">
                <div className="text-xl font-bold text-orange-600">81%</div>
                <div className="text-xs text-gray-600">Behavior</div>
              </div>
            </div>

            {/* Issues List */}
            <div data-testid="consistency-issues-list">
              <h4 className="font-medium mb-3">Consistency Issues</h4>
              <div className="space-y-2">
                {consistencyIssues.map((issue) => (
                  <div key={issue.id} className="border rounded-lg p-3" data-testid="consistency-issue">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="destructive" data-testid="issue-type">
                        {issue.type}
                      </Badge>
                      <Button size="sm" variant="outline" data-testid="resolve-issue-button">
                        Resolve
                      </Button>
                    </div>
                    <p className="text-sm mb-1" data-testid="issue-description">
                      {issue.description}
                    </p>
                    <p className="text-xs text-gray-500" data-testid="chapter-reference">
                      Found in: {issue.chapterReference}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Character Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Character Development Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" data-testid="character-timeline">
            {[
              { chapter: 1, event: 'Character introduction', type: 'introduction' },
              { chapter: 3, event: 'First major decision', type: 'development' },
              { chapter: 5, event: 'Character revelation', type: 'revelation' },
              { chapter: 7, event: 'Internal conflict', type: 'conflict' }
            ].map((event, index) => (
              <div key={index} className="flex items-center space-x-4" data-testid="timeline-event">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                  {event.chapter}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{event.event}</div>
                  <div className="text-sm text-gray-600">Chapter {event.chapter}</div>
                </div>
                <Badge variant="outline">{event.type}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>AI Character Development Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" data-testid="ai-character-suggestions">
            <div data-testid="development-suggestions">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="border rounded-lg p-4" data-testid="suggestion-card">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" data-testid="suggestion-type">
                      {suggestion.type}
                    </Badge>
                    <Button size="sm" data-testid="apply-suggestion-button">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Apply
                    </Button>
                  </div>
                  <p className="text-sm mb-2" data-testid="suggestion-description">
                    {suggestion.description}
                  </p>
                  <p className="text-xs text-gray-600" data-testid="suggestion-reasoning">
                    {suggestion.reasoning}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function CharacterRelationships({ storyId }: { storyId: string }) {
  const [relationships] = useState<Relationship[]>([
    {
      id: '1',
      character1: 'Elena Blackwood',
      character2: 'Marcus Stone',
      type: 'Allies/Potential Romance',
      strength: 75,
      history: 'Met during a case investigation',
      development: 'Growing trust and mutual respect'
    },
    {
      id: '2',
      character1: 'Elena Blackwood',
      character2: 'Dr. Sarah Chen',
      type: 'Mentor/Friend',
      strength: 90,
      history: 'Former colleagues at the police department',
      development: 'Steady supportive relationship'
    }
  ]);

  const [showRelationshipModal, setShowRelationshipModal] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);

  return (
    <div className="space-y-6" data-testid="character-relationships-page">
      {/* Relationship Map */}
      <Card>
        <CardHeader>
          <CardTitle>Character Relationship Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center relative" data-testid="relationship-map">
            {/* Character Nodes */}
            <div className="absolute top-4 left-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold" data-testid="character-node">
                EB
              </div>
              <div className="text-xs text-center mt-1">Elena</div>
            </div>
            
            <div className="absolute top-4 right-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white font-bold" data-testid="character-node">
                MS
              </div>
              <div className="text-xs text-center mt-1">Marcus</div>
            </div>
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold" data-testid="character-node">
                SC
              </div>
              <div className="text-xs text-center mt-1">Sarah</div>
            </div>

            {/* Relationship Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line
                x1="20%"
                y1="20%"
                x2="80%"
                y2="20%"
                stroke="#3B82F6"
                strokeWidth="2"
                data-testid="relationship-line"
                className="cursor-pointer"
                onClick={() => {
                  setSelectedRelationship(relationships[0]);
                  setShowRelationshipModal(true);
                }}
              />
              <line
                x1="20%"
                y1="30%"
                x2="50%"
                y2="80%"
                stroke="#10B981"
                strokeWidth="2"
                data-testid="relationship-line"
                className="cursor-pointer"
              />
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Relationship Details Modal */}
      <Dialog open={showRelationshipModal} onOpenChange={setShowRelationshipModal}>
        <DialogContent data-testid="relationship-details-modal">
          <DialogHeader>
            <DialogTitle>Relationship Details</DialogTitle>
          </DialogHeader>
          {selectedRelationship && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Relationship Type</label>
                <div data-testid="relationship-type">{selectedRelationship.type}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Relationship Strength</label>
                <div className="flex items-center space-x-2">
                  <Progress value={selectedRelationship.strength} className="flex-1" />
                  <span data-testid="relationship-strength">{selectedRelationship.strength}%</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">History</label>
                <p className="text-sm text-gray-600" data-testid="relationship-history">
                  {selectedRelationship.history}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Development</label>
                <p className="text-sm text-gray-600" data-testid="relationship-development">
                  {selectedRelationship.development}
                </p>
              </div>

              {/* Relationship Timeline */}
              <div data-testid="relationship-timeline">
                <label className="text-sm font-medium mb-2 block">Relationship Timeline</label>
                <div className="space-y-2">
                  {[
                    { chapter: 2, event: 'First meeting', description: 'Initial encounter during investigation' },
                    { chapter: 4, event: 'Trust building', description: 'Working together on first case' },
                    { chapter: 6, event: 'Conflict', description: 'Disagreement over methods' }
                  ].map((event, index) => (
                    <div key={index} className="flex items-center space-x-3" data-testid="relationship-event">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                        {event.chapter}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{event.event}</div>
                        <div className="text-xs text-gray-600">{event.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}