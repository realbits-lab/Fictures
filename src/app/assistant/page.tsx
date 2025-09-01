import { MainLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Progress } from "@/components/ui";

export default function AssistantPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <span>🤖</span>
            AI Writing Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Your intelligent writing companion powered by advanced AI
          </p>
        </div>

        {/* AI Status */}
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🟢</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">AI Status: Active</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Model: GPT-4 Enhanced Writing</p>
                </div>
              </div>
              <Badge variant="success">Online</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Writing Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>📝 Active Writing Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">Chapter 16: &ldquo;Final Confrontation&rdquo;</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">The Shadow Keeper</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Progress:</span>
                    <span className="font-medium">2,847 / 4,000 words</span>
                  </div>
                  <Progress value={71} variant="success" />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm">Continue Writing</Button>
                  <Button size="sm" variant="ghost">View Session</Button>
                </div>
              </div>

              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg opacity-75">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">Chapter 17: Planning</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">The Shadow Keeper</p>
                  </div>
                  <Badge variant="default">Draft</Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="secondary">Start Writing</Button>
                  <Button size="sm" variant="ghost">View Outline</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🎯 Writing Assistance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Character Development</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  &ldquo;Maya&rsquo;s character arc needs deeper internal conflict. Consider showing her struggle between power and humanity through her dialogue.&rdquo;
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="secondary">Apply Suggestion</Button>
                  <Button size="sm" variant="ghost">Learn More</Button>
                </div>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Plot Consistency</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  &ldquo;Great tension building! The pacing matches your established rhythm perfectly.&rdquo;
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="ghost">✨ View Analysis</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Tools */}
        <Card>
          <CardHeader>
            <CardTitle>🛠️ AI Writing Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                <div className="text-2xl mb-2">📖</div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Story Analyzer</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Analyze plot and pacing</p>
              </div>
              
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                <div className="text-2xl mb-2">🎭</div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Character Builder</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Develop characters deeply</p>
              </div>
              
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                <div className="text-2xl mb-2">🗺️</div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">World Builder</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Create consistent worlds</p>
              </div>
              
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                <div className="text-2xl mb-2">💡</div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Idea Generator</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Spark new story ideas</p>
              </div>
              
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                <div className="text-2xl mb-2">🎨</div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Style Coach</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Improve writing style</p>
              </div>
              
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                <div className="text-2xl mb-2">🔍</div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Plot Checker</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Find plot holes</p>
              </div>
              
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                <div className="text-2xl mb-2">📚</div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Research Assistant</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Quick fact checking</p>
              </div>
              
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                <div className="text-2xl mb-2">✏️</div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Editor</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Grammar and style</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent AI Interactions */}
        <Card>
          <CardHeader>
            <CardTitle>💬 Recent AI Interactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900 dark:text-gray-100">Character Development Session</span>
                <span className="text-xs text-gray-500">2 minutes ago</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                &ldquo;How can I show Maya&rsquo;s internal conflict without using exposition?&rdquo;
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                AI suggested using contradictory actions and subtext in dialogue...
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900 dark:text-gray-100">Plot Analysis</span>
                <span className="text-xs text-gray-500">1 hour ago</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                &ldquo;Is my pacing too slow in Chapter 15?&rdquo;
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                AI analyzed your chapter and found excellent tension building...
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900 dark:text-gray-100">World Building</span>
                <span className="text-xs text-gray-500">3 hours ago</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                &ldquo;Help me design the Shadow Realm&rsquo;s physics system&rdquo;
              </p>
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                AI created a comprehensive magic system framework...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}