import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";

export default function DataAnalysisPage() {
  return (
    <div className="space-y-6">
      {/* Analysis Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Analysis Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Detailed Writing Analysis</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Track comprehensive writing metrics and patterns</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Reader Analysis</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Track how readers interact with your stories</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Performance Insights</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get insights on your writing performance trends</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Weekly Reports</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receive weekly analysis summaries via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Analysis Dashboard Layout
            </label>
            <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" defaultValue="Standard View">
              <option>Compact View</option>
              <option>Standard View</option>
              <option>Detailed View</option>
              <option>Custom Layout</option>
            </select>
          </div>

          <div className="flex gap-3">
            <Button>Save Changes</Button>
            <Button variant="ghost">Cancel</Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle>🗂️ Data Retention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Analysis History
            </label>
            <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" defaultValue="1 Year">
              <option>1 Month</option>
              <option>3 Months</option>
              <option>6 Months</option>
              <option>1 Year</option>
              <option>2 Years</option>
              <option>Forever</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              How long to keep your analysis data for historical analysis
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Export Format
            </label>
            <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" defaultValue="CSV">
              <option>CSV</option>
              <option>JSON</option>
              <option>Excel (.xlsx)</option>
              <option>PDF Report</option>
            </select>
          </div>

          <div className="flex gap-3">
            <Button variant="outline">Export Analysis Data</Button>
            <Button variant="outline">Clear Analysis History</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Categories */}
      <Card>
        <CardHeader>
          <CardTitle>📈 Tracking Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Writing Metrics</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="mr-3 rounded text-blue-600" />
                  <span className="text-sm">Word count per day</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="mr-3 rounded text-blue-600" />
                  <span className="text-sm">Writing streak</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="mr-3 rounded text-blue-600" />
                  <span className="text-sm">Session duration</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-3 rounded text-blue-600" />
                  <span className="text-sm">Writing speed (WPM)</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="mr-3 rounded text-blue-600" />
                  <span className="text-sm">Goal completion</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Reader Engagement</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="mr-3 rounded text-blue-600" />
                  <span className="text-sm">Story views</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="mr-3 rounded text-blue-600" />
                  <span className="text-sm">Read completion rate</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="mr-3 rounded text-blue-600" />
                  <span className="text-sm">Comments and likes</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-3 rounded text-blue-600" />
                  <span className="text-sm">Reader demographics</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="mr-3 rounded text-blue-600" />
                  <span className="text-sm">Sharing metrics</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Usage */}
      <Card>
        <CardHeader>
          <CardTitle>💾 Storage & Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">2.3 MB</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Stories Data</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">847 KB</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Analysis Data</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">3.1 MB</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Usage</div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Storage Used</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">3.1 MB of 100 MB</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{width: '3.1%'}}></div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Analysis data is automatically cleaned up based on your retention settings.
              Stories and user data are kept until you delete them.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}