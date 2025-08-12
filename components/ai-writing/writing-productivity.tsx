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
  Clock,
  Target,
  Calendar,
  Zap,
  Award,
  Plus,
  Settings,
  Brain
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WritingGoal {
  id: string;
  title: string;
  type: 'word-count' | 'chapters' | 'daily-writing' | 'completion-date' | 'reader-engagement' | 'revenue' | 'story-completion' | 'follower-growth';
  targetValue: number;
  currentValue: number;
  deadline: string;
  dailyTarget?: number;
  reminderEnabled: boolean;
  rewardEnabled: boolean;
}

interface WritingSession {
  date: string;
  duration: number;
  wordsWritten: number;
  productivity: number;
}

interface ProductivityRecommendation {
  id: string;
  title: string;
  description: string;
  expectedImpact: string;
  category: 'schedule' | 'environment' | 'habits' | 'tools';
}

export function WritingProductivityDashboard({ storyId }: { storyId: string }) {
  const [sessions] = useState<WritingSession[]>([
    { date: '2024-01-15', duration: 90, wordsWritten: 1250, productivity: 85 },
    { date: '2024-01-14', duration: 60, wordsWritten: 800, productivity: 78 },
    { date: '2024-01-13', duration: 120, wordsWritten: 1800, productivity: 92 },
    { date: '2024-01-12', duration: 75, wordsWritten: 950, productivity: 80 }
  ]);

  const sessionMetrics = {
    totalTime: sessions.reduce((sum, s) => sum + s.duration, 0),
    todayWords: sessions[0]?.wordsWritten || 0,
    averageWords: Math.round(sessions.reduce((sum, s) => sum + s.wordsWritten, 0) / sessions.length),
    streak: 7
  };

  return (
    <div className="space-y-6" data-testid="writing-productivity-page">
      {/* Session Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Writing Session Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="writing-session-metrics">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600" data-testid="total-writing-time">
                {Math.round(sessionMetrics.totalTime / 60)}h
              </div>
              <div className="text-sm text-blue-600">Total Time</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Zap className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600" data-testid="words-written-today">
                {sessionMetrics.todayWords}
              </div>
              <div className="text-sm text-green-600">Words Today</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Target className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600" data-testid="average-words-per-session">
                {sessionMetrics.averageWords}
              </div>
              <div className="text-sm text-purple-600">Avg Words/Session</div>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Award className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold text-orange-600" data-testid="writing-streak">
                {sessionMetrics.streak}
              </div>
              <div className="text-sm text-orange-600">Day Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Productivity Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Productivity Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6" data-testid="productivity-charts">
            <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center" data-testid="daily-word-count-chart">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Daily word count visualization</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center" data-testid="writing-time-distribution">
                <div className="text-center">
                  <Clock className="h-8 w-8 mx-auto mb-1 text-gray-400" />
                  <p className="text-sm text-gray-500">Time distribution</p>
                </div>
              </div>

              <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center" data-testid="productivity-trends">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-1 text-gray-400" />
                  <p className="text-sm text-gray-500">Productivity trends</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Writing Goals */}
      <WritingGoalsSection storyId={storyId} />
    </div>
  );
}

export function WritingGoalsSection({ storyId }: { storyId: string }) {
  const [goals, setGoals] = useState<WritingGoal[]>([
    {
      id: '1',
      title: 'Complete First Draft',
      type: 'word-count',
      targetValue: 80000,
      currentValue: 45000,
      deadline: '2024-12-31',
      dailyTarget: 500,
      reminderEnabled: true,
      rewardEnabled: false
    },
    {
      id: '2',
      title: 'Daily Writing Habit',
      type: 'daily-writing',
      targetValue: 30,
      currentValue: 7,
      deadline: '2024-02-28',
      dailyTarget: 300,
      reminderEnabled: true,
      rewardEnabled: true
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    type: 'word-count' as WritingGoal['type'],
    targetValue: 0,
    deadline: '',
    dailyTarget: 0,
    reminderEnabled: false,
    rewardEnabled: false
  });

  const handleCreateGoal = () => {
    const goal: WritingGoal = {
      id: Date.now().toString(),
      title: newGoal.title,
      type: newGoal.type,
      targetValue: newGoal.targetValue,
      currentValue: 0,
      deadline: newGoal.deadline,
      dailyTarget: newGoal.dailyTarget > 0 ? newGoal.dailyTarget : undefined,
      reminderEnabled: newGoal.reminderEnabled,
      rewardEnabled: newGoal.rewardEnabled
    };

    setGoals([...goals, goal]);
    setNewGoal({
      title: '',
      type: 'word-count',
      targetValue: 0,
      deadline: '',
      dailyTarget: 0,
      reminderEnabled: false,
      rewardEnabled: false
    });
    setShowCreateModal(false);
  };

  return (
    <Card data-testid="writing-goals-section">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Writing Goals</CardTitle>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button data-testid="create-goal-button">
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="create-goal-modal">
              <DialogHeader>
                <DialogTitle>Create Writing Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Goal Title</label>
                  <Input
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    data-testid="goal-title-input"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Goal Type</label>
                  <Select value={newGoal.type} onValueChange={(value) => setNewGoal({ ...newGoal, type: value as WritingGoal['type'] })}>
                    <SelectTrigger data-testid="goal-type-selector">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="word-count" data-testid="goal-type-word-count">Word Count Goal</SelectItem>
                      <SelectItem value="chapters" data-testid="goal-type-chapters">Chapter Completion</SelectItem>
                      <SelectItem value="daily-writing" data-testid="goal-type-daily-writing">Daily Writing</SelectItem>
                      <SelectItem value="completion-date" data-testid="goal-type-completion-date">Completion Date</SelectItem>
                      <SelectItem value="reader-engagement" data-testid="goal-type-reader-engagement">Reader Engagement</SelectItem>
                      <SelectItem value="revenue" data-testid="goal-type-revenue">Revenue Target</SelectItem>
                      <SelectItem value="story-completion" data-testid="goal-type-story-completion">Story Completion</SelectItem>
                      <SelectItem value="follower-growth" data-testid="goal-type-follower-growth">Follower Growth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newGoal.type === 'word-count' && (
                  <div>
                    <label className="text-sm font-medium">Target Word Count</label>
                    <Input
                      type="number"
                      value={newGoal.targetValue}
                      onChange={(e) => setNewGoal({ ...newGoal, targetValue: parseInt(e.target.value) })}
                      data-testid="target-word-count-input"
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Deadline</label>
                  <Input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    data-testid="goal-deadline-input"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newGoal.dailyTarget > 0}
                      onChange={(e) => setNewGoal({ 
                        ...newGoal, 
                        dailyTarget: e.target.checked ? 500 : 0 
                      })}
                      data-testid="daily-target-toggle"
                    />
                    <span>Set Daily Target</span>
                  </label>
                </div>

                <div data-testid="reminder-settings">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newGoal.reminderEnabled}
                      onChange={(e) => setNewGoal({ ...newGoal, reminderEnabled: e.target.checked })}
                    />
                    <span>Enable Reminders</span>
                  </label>
                </div>

                <div data-testid="reward-system-toggle">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newGoal.rewardEnabled}
                      onChange={(e) => setNewGoal({ ...newGoal, rewardEnabled: e.target.checked })}
                    />
                    <span>Enable Reward System</span>
                  </label>
                </div>

                {/* Story Selector (hidden for now) */}
                <div style={{ display: 'none' }} data-testid="story-selector">
                  <select>
                    <option>Select Story</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateGoal}
                    disabled={!newGoal.title || newGoal.targetValue === 0}
                    data-testid="create-goal-submit"
                  >
                    Create Goal
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4" data-testid="active-goal">
          {goals.map((goal) => (
            <div key={goal.id} className="border rounded-lg p-4" data-testid="goal-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium" data-testid="goal-title">{goal.title}</h4>
                  <Badge variant="outline" data-testid="goal-type">{goal.type}</Badge>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div data-testid="days-remaining">
                    {Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days left
                  </div>
                  <div data-testid="deadline">{goal.deadline}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span data-testid="progress-percentage">
                    {Math.round((goal.currentValue / goal.targetValue) * 100)}%
                  </span>
                </div>
                <Progress value={(goal.currentValue / goal.targetValue) * 100} data-testid="progress-bar" />
                <div className="text-xs text-gray-500">
                  {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()} {goal.type === 'word-count' ? 'words' : 'units'}
                </div>
              </div>

              {goal.dailyTarget && (
                <div className="mt-3 text-sm">
                  <span className="text-gray-600">Daily target: </span>
                  <span className="font-medium" data-testid="daily-target">{goal.dailyTarget} words</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function WritingHabitsAnalysis({ storyId }: { storyId: string }) {
  const [patterns] = useState({
    peakTimes: [
      { time: '6:00 AM', productivity: 92 },
      { time: '2:00 PM', productivity: 85 },
      { time: '9:00 PM', productivity: 78 }
    ],
    environment: {
      mostProductiveLocation: 'Home Office',
      optimalSessionLength: '90 minutes',
      distractionPatterns: 'Social media, phone notifications'
    }
  });

  const [recommendations] = useState<ProductivityRecommendation[]>([
    {
      id: '1',
      title: 'Optimize Morning Writing Sessions',
      description: 'Your productivity peaks at 6 AM. Consider scheduling your most important writing during this time.',
      expectedImpact: '+15% word output',
      category: 'schedule'
    },
    {
      id: '2',
      title: 'Reduce Notification Distractions',
      description: 'Turn off social media notifications during writing sessions to maintain focus.',
      expectedImpact: '+20% focus time',
      category: 'environment'
    }
  ]);

  return (
    <div className="space-y-6" data-testid="writing-habits-page">
      {/* Writing Patterns */}
      <Card>
        <CardHeader>
          <CardTitle>Writing Patterns Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6" data-testid="writing-patterns-analysis">
            {/* Peak Times */}
            <div data-testid="peak-productivity-times">
              <h4 className="font-medium mb-3">Peak Productivity Times</h4>
              <div className="space-y-2">
                {patterns.peakTimes.map((time, index) => (
                  <div key={index} className="flex items-center justify-between" data-testid="time-slot">
                    <span className="font-medium">{time.time}</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={time.productivity} className="w-24" />
                      <span className="text-sm text-gray-600">{time.productivity}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Environment Analysis */}
            <div data-testid="environment-analysis">
              <h4 className="font-medium mb-3">Writing Environment</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="font-medium text-blue-600" data-testid="most-productive-location">
                    {patterns.environment.mostProductiveLocation}
                  </div>
                  <div className="text-sm text-blue-600">Most Productive Location</div>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="font-medium text-green-600" data-testid="optimal-session-length">
                    {patterns.environment.optimalSessionLength}
                  </div>
                  <div className="text-sm text-green-600">Optimal Session Length</div>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="font-medium text-red-600" data-testid="distraction-patterns">
                    High
                  </div>
                  <div className="text-sm text-red-600">Distraction Level</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Productivity Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" data-testid="productivity-recommendations">
            {recommendations.map((rec) => (
              <div key={rec.id} className="border rounded-lg p-4" data-testid="recommendation-card">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium" data-testid="recommendation-title">{rec.title}</h4>
                  <Badge variant="outline">{rec.category}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2" data-testid="recommendation-description">
                  {rec.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-600" data-testid="expected-impact">
                    {rec.expectedImpact}
                  </span>
                  <Button size="sm" variant="outline">Apply</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function WritingScheduleOptimization({ storyId }: { storyId: string }) {
  const [schedule] = useState([
    { day: 'Monday', time: '6:00 AM - 8:00 AM', productivity: 92 },
    { day: 'Tuesday', time: '2:00 PM - 4:00 PM', productivity: 85 },
    { day: 'Wednesday', time: '6:00 AM - 8:00 AM', productivity: 90 },
    { day: 'Thursday', time: '7:00 PM - 9:00 PM', productivity: 78 },
    { day: 'Friday', time: '6:00 AM - 8:00 AM', productivity: 88 }
  ]);

  const [showOptimizationModal, setShowOptimizationModal] = useState(false);

  return (
    <div className="space-y-6" data-testid="writing-schedule-page">
      {/* Current Schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Writing Schedule</CardTitle>
            <Dialog open={showOptimizationModal} onOpenChange={setShowOptimizationModal}>
              <DialogTrigger asChild>
                <Button data-testid="optimize-schedule-button">
                  <Brain className="h-4 w-4 mr-2" />
                  Optimize Schedule
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="schedule-optimization-modal">
                <DialogHeader>
                  <DialogTitle>AI Schedule Optimization</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div data-testid="productivity-patterns-factor">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span>Consider productivity patterns</span>
                    </label>
                  </div>

                  <div data-testid="goal-deadlines-factor">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span>Factor in goal deadlines</span>
                    </label>
                  </div>

                  <div data-testid="availability-factor">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span>Consider availability constraints</span>
                    </label>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={() => {
                      // Simulate AI processing
                      setTimeout(() => {
                        alert('Schedule optimized successfully');
                        setShowOptimizationModal(false);
                      }, 2000);
                    }}
                    data-testid="generate-optimized-schedule"
                  >
                    Generate Optimized Schedule
                  </Button>

                  {/* Optimized Schedule Results */}
                  <div data-testid="optimized-schedule" style={{ display: 'none' }}>
                    <h4 className="font-medium mb-2">Optimized Schedule</h4>
                    <div className="space-y-2">
                      {schedule.map((slot, index) => (
                        <div key={index} className="border rounded p-2" data-testid="optimized-slot">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium" data-testid="time-slot">{slot.time}</div>
                              <div className="text-sm text-gray-600">{slot.day}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium" data-testid="expected-productivity">
                                {slot.productivity}% productivity
                              </div>
                              <div className="text-xs text-gray-500" data-testid="confidence-score">
                                95% confidence
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full mt-4" data-testid="apply-optimized-schedule">
                      Apply Schedule
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" data-testid="current-writing-schedule">
            {schedule.map((slot, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg" data-testid="schedule-slot">
                <div>
                  <div className="font-medium">{slot.day}</div>
                  <div className="text-sm text-gray-600">{slot.time}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{slot.productivity}% productivity</div>
                  <Progress value={slot.productivity} className="w-20 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}