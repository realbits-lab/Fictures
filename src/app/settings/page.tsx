import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MainLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui";

export default async function SettingsPage() {
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
            <span>⚙️</span>
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Customize your writing experience and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Navigation */}
          <div className="space-y-4">
            <Card>
              <CardContent className="py-4">
                <div className="space-y-2">
                  <Button variant="secondary" size="sm" className="w-full justify-start">
                    👤 Account Settings
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    ✏️ Writing Preferences
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    🤖 AI Assistant
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    🎨 Appearance
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    🔔 Notifications
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    🔒 Privacy & Security
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    📊 Data & Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle>👤 Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Alexandra Writer"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue="alex@example.com"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Bio
                  </label>
                  <textarea
                    rows={3}
                    defaultValue="Fantasy and sci-fi writer passionate about creating immersive worlds and complex characters."
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="flex gap-3">
                  <Button>Save Changes</Button>
                  <Button variant="ghost">Cancel</Button>
                </div>
              </CardContent>
            </Card>

            {/* Writing Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>✏️ Writing Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Default Word Count Target
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                      <option>3,000 words</option>
                      <option selected>4,000 words</option>
                      <option>5,000 words</option>
                      <option>Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Auto-save Interval
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                      <option>15 seconds</option>
                      <option selected>30 seconds</option>
                      <option>1 minute</option>
                      <option>Disabled</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Distraction-free Mode</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Hide UI elements while writing</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Daily Writing Goal Tracking</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Track daily word count progress</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Show Writing Analytics</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Display pace, emotion, and style metrics</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Assistant Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  🤖 AI Assistant Settings
                  <Badge variant="success">Active</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    AI Writing Style
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                    <option>Creative & Inspirational</option>
                    <option selected>Balanced & Constructive</option>
                    <option>Technical & Analytical</option>
                    <option>Minimal Suggestions</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Real-time Suggestions</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Get AI suggestions as you write</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Character Consistency Checking</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Warn about character inconsistencies</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Plot Analysis</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Analyze plot structure and pacing</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appearance Settings */}
            <Card>
              <CardHeader>
                <CardTitle>🎨 Appearance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <input type="radio" name="theme" id="light" className="text-blue-600" />
                      <label htmlFor="light" className="text-sm text-gray-600 dark:text-gray-400">☀️ Light</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="radio" name="theme" id="dark" defaultChecked className="text-blue-600" />
                      <label htmlFor="dark" className="text-sm text-gray-600 dark:text-gray-400">🌙 Dark</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="radio" name="theme" id="auto" className="text-blue-600" />
                      <label htmlFor="auto" className="text-sm text-gray-600 dark:text-gray-400">🔄 Auto</label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Font Family
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                    <option selected>Inter (Default)</option>
                    <option>Georgia</option>
                    <option>Times New Roman</option>
                    <option>Arial</option>
                    <option>Courier New</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Writing Font Size
                  </label>
                  <div className="flex items-center gap-4">
                    <input type="range" min="12" max="20" defaultValue="14" className="flex-1" />
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-8">14px</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}