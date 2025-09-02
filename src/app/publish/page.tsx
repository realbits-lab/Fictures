import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MainLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Progress } from "@/components/ui";

export default async function PublishPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <span>📤</span>
            Publication Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Schedule, publish, and track your story releases
          </p>
        </div>

        {/* Publishing Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              📅 Publishing Schedule
              <Button variant="secondary" size="sm">⚙️ Schedule Settings</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">This Week</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-center space-y-2">
                    <div className="font-medium text-gray-900 dark:text-gray-100">Wed Nov 15</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Ch 16: Final Confrontation</div>
                    <div className="text-xs text-gray-500">⏰ 2:00 PM</div>
                    <Badge variant="success" size="sm">✅ Ready</Badge>
                    <Button size="sm" className="w-full mt-2">📤 Publish</Button>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-center space-y-2">
                    <div className="font-medium text-gray-900 dark:text-gray-100">Fri Nov 17</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Part III Complete</div>
                    <div className="text-xs text-gray-500">⏰ 6:00 PM</div>
                    <Badge variant="warning" size="sm">📝 Draft</Badge>
                    <Button variant="secondary" size="sm" className="w-full mt-2">✏️ Edit</Button>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-center space-y-2">
                    <div className="font-medium text-gray-900 dark:text-gray-100">Mon Nov 20</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">New Story Announcement</div>
                    <div className="text-xs text-gray-500">⏰ 12:00 PM</div>
                    <Badge variant="info" size="sm">📋 Planned</Badge>
                    <Button variant="ghost" size="sm" className="w-full mt-2">📝 Write</Button>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-center space-y-2">
                    <div className="font-medium text-gray-900 dark:text-gray-100">Wed Nov 22</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Ch 1: Next Adventure</div>
                    <div className="text-xs text-gray-500">⏰ 2:00 PM</div>
                    <Badge variant="default" size="sm">💭 Idea</Badge>
                    <Button variant="ghost" size="sm" className="w-full mt-2">📋 Plan</Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Publish */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Quick Publish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                Chapter 16: &ldquo;Final Confrontation&rdquo; - Ready to Publish
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Word Count:</span>
                  <Badge variant="success" size="sm">4,247 ✅</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Target:</span>
                  <Badge variant="success" size="sm">4,000 ✅</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Quality Check:</span>
                  <Badge variant="success" size="sm">✅</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Title:</span>
                  <Badge variant="success" size="sm">Final Confrontation ✅</Badge>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Preview:</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  &ldquo;Maya stood at the threshold between worlds, shadows dancing around her like eager servants. 
                  The Void Collector&rsquo;s offer hung in the air...&rdquo;
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Schedule Options:</h4>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="schedule" className="text-blue-600" />
                      <span className="text-sm">🔘 Publish Now</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="schedule" className="text-blue-600" defaultChecked />
                      <span className="text-sm">🔘 Schedule: Nov 15, 2:00 PM</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="schedule" className="text-blue-600" />
                      <span className="text-sm">🔘 Save as Draft</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Community Features:</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="text-blue-600" />
                      <span className="text-sm">☑️ Enable comments</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="text-blue-600" />
                      <span className="text-sm">☑️ Allow theories</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="text-blue-600" />
                      <span className="text-sm">☑️ Notify subscribers</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="text-blue-600" />
                      <span className="text-sm">☑️ Community poll: &ldquo;What should Maya choose?&rdquo;</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="ghost">🔍 Preview</Button>
                <Button variant="secondary">✏️ Edit</Button>
                <Button>📤 Publish</Button>
                <Button variant="ghost">💾 Save Draft</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>📊 Publication Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Chapter 15 Performance</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Published: 3 days ago</div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>👁️ Views: <span className="font-medium">3,247</span></div>
                  <div>💬 Comments: <span className="font-medium">126</span></div>
                  <div>❤️ Reactions: <span className="font-medium">456</span></div>
                  <div>⭐ Rating: <span className="font-medium">4.9/5</span></div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-sm mb-1">
                    <span>📈 Engagement Rate:</span>
                    <span className="font-medium">87%</span>
                  </div>
                  <div className="text-sm text-green-600">🔥 Trending: #2 in Fantasy</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🎯 Reader Engagement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">📈 Pre-publish Buzz</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Theories:</span>
                    <span className="font-medium text-green-600">+89 new</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Comments:</span>
                    <span className="font-medium text-green-600">+234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Anticipation:</span>
                    <span className="font-medium">94%</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">📊 Optimal Time:</h5>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Wed 2:00 PM PST<br />
                    <span className="text-xs">(89% readers active)</span>
                  </div>
                  <Button size="sm" variant="ghost" className="mt-2">📋 Engagement Tips</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}