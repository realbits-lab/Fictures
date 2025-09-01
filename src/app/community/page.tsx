import { MainLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from "@/components/ui";

export default function CommunityPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <span>💬</span>
            Community Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Connect with readers and fellow writers
          </p>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="py-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-blue-600">2,247</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Readers Today</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="py-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-green-600">1,456</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Comments Today</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="py-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-purple-600">4.7</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Average Rating</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trending Discussions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>🔥 Trending Discussions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        🏆 &ldquo;Maya&rsquo;s True Power Theory - MASSIVE PLOT TWIST INCOMING!&rdquo;
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">by @TheoryMaster</p>
                    </div>
                    <Badge variant="danger">Hot</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>💬 347 replies</span>
                    <span>🔥 23 reactions</span>
                    <span>Posted 4h ago</span>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        🎯 &ldquo;Chapter 15 Predictions & Elena&rsquo;s Fate&rdquo;
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">by @ShadowFan2024</p>
                    </div>
                    <Badge variant="info">Active</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>💬 89 replies</span>
                    <span>❤️ 156 reactions</span>
                    <span>Posted 1d ago</span>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        🔍 &ldquo;Character Arc Analysis: Marcus Webb&rdquo;
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">by @LitAnalyst</p>
                    </div>
                    <Badge variant="success">Quality</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>💬 67 replies</span>
                    <span>🧠 89 reactions</span>
                    <span>Posted 2d ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Community Stats Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📊 This Week</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Readers</span>
                  <span className="font-medium">12,891</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Comments</span>
                  <span className="font-medium">8,934</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Rating Trend</span>
                  <span className="font-medium text-green-600">↗️ +0.1</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🎨 Fan Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    🎨 &ldquo;Maya vs Void Collector&rdquo;
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Fan Art by @ArtistPro</div>
                  <div className="text-xs text-gray-500 mt-1">❤️ 234 | 🎨 12 shares</div>
                </div>

                <div className="text-sm">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    🎵 &ldquo;Shadow Song - Elena&rsquo;s Theme&rdquo;
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Music by @Composer</div>
                  <div className="text-xs text-gray-500 mt-1">🎵 45 plays | ❤️ 67</div>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full">📝 New Post</Button>
          </div>
        </div>

        {/* Recent Comments */}
        <Card>
          <CardHeader>
            <CardTitle>📝 Recent Comments on Your Chapters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                Chapter 15: &ldquo;Sister&rsquo;s Choice&rdquo;
              </div>
              <blockquote className="text-gray-600 dark:text-gray-400 text-sm italic mb-2">
                &ldquo;OMG Elena&rsquo;s decision gave me chills! How does she know about Maya&rsquo;s power limit? 
                THEORY: Elena has been learning shadow magic too!&rdquo;
              </blockquote>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>@ReadingAddict</span>
                <span>❤️ 23</span>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">💬 Reply</Button>
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                Chapter 15: &ldquo;Sister&rsquo;s Choice&rdquo;
              </div>
              <blockquote className="text-gray-600 dark:text-gray-400 text-sm italic mb-2">
                &ldquo;The way you write Maya&rsquo;s internal conflict is incredible. Can&rsquo;t wait to see her 
                choose between safety and power in the finale!&rdquo;
              </blockquote>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>@FantasyLover99</span>
                <span>❤️ 45</span>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">🏆 Pin Comment</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}