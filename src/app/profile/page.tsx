import { MainLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Progress } from "@/components/ui";

export default function ProfilePage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            AW
          </div>
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Alexandra Writer</h1>
                <p className="text-gray-600 dark:text-gray-400">@alexwriter • Member since Oct 2023</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="success">Pro Author</Badge>
                <Badge variant="info">Level 7</Badge>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 max-w-2xl">
              Fantasy and sci-fi writer passionate about creating immersive worlds and complex characters. 
              Currently working on The Shadow Keeper series with AI assistance.
            </p>
            <div className="flex gap-3 mt-4">
              <Button size="sm">Edit Profile</Button>
              <Button size="sm" variant="ghost">Share Profile</Button>
            </div>
          </div>
        </div>

        {/* Profile Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-blue-600">127K</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Words</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-green-600">3</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Stories Published</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-purple-600">2.4K</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-orange-600">4.8</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Published Stories */}
            <Card>
              <CardHeader>
                <CardTitle>📚 Published Stories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">The Shadow Keeper</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Urban Fantasy • 16 Chapters</p>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Maya discovers her power to manipulate shadows in a world where reality bends to supernatural forces...
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="space-x-4">
                      <span>👁️ 45.2K views</span>
                      <span>💬 1.2K comments</span>
                      <span>⭐ 4.9/5</span>
                    </div>
                    <Button size="sm" variant="ghost">View Story</Button>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">Dragon Chronicles</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Epic Fantasy • 12 Chapters</p>
                    </div>
                    <Badge variant="default">Completed</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    An ancient prophecy awakens as dragons return to a world that has forgotten their majesty...
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="space-x-4">
                      <span>👁️ 28.7K views</span>
                      <span>💬 892 comments</span>
                      <span>⭐ 4.7/5</span>
                    </div>
                    <Button size="sm" variant="ghost">View Story</Button>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">Stellar Drift</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Sci-Fi • 8 Chapters</p>
                    </div>
                    <Badge variant="warning">Hiatus</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Captain Elena navigates the vastness of space while uncovering a conspiracy that spans galaxies...
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="space-x-4">
                      <span>👁️ 12.4K views</span>
                      <span>💬 456 comments</span>
                      <span>⭐ 4.6/5</span>
                    </div>
                    <Button size="sm" variant="ghost">View Story</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>📈 Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-sm">
                    📝
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      Published <span className="font-medium">Chapter 16: &ldquo;Final Confrontation&rdquo;</span> 
                      in The Shadow Keeper
                    </p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center text-sm">
                    💬
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      Replied to <span className="font-medium">@ReadingAddict</span>&rsquo;s comment about Maya&rsquo;s character development
                    </p>
                    <p className="text-xs text-gray-500">5 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center text-sm">
                    🎯
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      Reached <span className="font-medium">daily writing goal</span> of 2,000 words
                    </p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center text-sm">
                    🏆
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      Earned <span className="font-medium">&ldquo;Trending Author&rdquo;</span> achievement
                    </p>
                    <p className="text-xs text-gray-500">2 days ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Writing Progress */}
            <Card>
              <CardHeader>
                <CardTitle>🎯 Writing Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Daily Goal</span>
                    <span className="font-medium">1,847 / 2,000</span>
                  </div>
                  <Progress value={92} variant="success" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Weekly Goal</span>
                    <span className="font-medium">8,234 / 10,000</span>
                  </div>
                  <Progress value={82} variant="success" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Goal</span>
                    <span className="font-medium">23,567 / 40,000</span>
                  </div>
                  <Progress value={59} variant="warning" />
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Streak:</span>
                      <span className="font-medium">12 days 🔥</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Best Streak:</span>
                      <span className="font-medium">34 days</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>🏆 Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                    🔥
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">Trending Author</div>
                    <div className="text-xs text-gray-500">Story reached #2 in Fantasy</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    📚
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">Chapter Master</div>
                    <div className="text-xs text-gray-500">Published 50 chapters</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    💬
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">Community Favorite</div>
                    <div className="text-xs text-gray-500">1000+ total comments</div>
                  </div>
                </div>

                <Button size="sm" variant="ghost" className="w-full">View All Achievements</Button>
              </CardContent>
            </Card>

            {/* Following */}
            <Card>
              <CardHeader>
                <CardTitle>👥 Community</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Following:</span>
                  <span className="font-medium">127</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Followers:</span>
                  <span className="font-medium">2,384</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Comments:</span>
                  <span className="font-medium">1,247</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Theories Posted:</span>
                  <span className="font-medium">89</span>
                </div>
                
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Button size="sm" variant="ghost" className="w-full">View Community Stats</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}