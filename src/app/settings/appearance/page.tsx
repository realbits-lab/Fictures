import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";

export default function AppearancePage() {
  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle>🎨 Theme & Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
              Theme Mode
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <input type="radio" name="theme" id="light" className="sr-only peer" />
                <label htmlFor="light" className="flex flex-col items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-300 peer-checked:border-blue-500 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-900/20">
                  <div className="w-16 h-12 bg-white border border-gray-300 rounded shadow-sm flex items-center justify-center">
                    <div className="w-8 h-2 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>☀️</span>
                    <span>Light Mode</span>
                  </div>
                </label>
              </div>
              <div className="relative">
                <input type="radio" name="theme" id="dark" defaultChecked className="sr-only peer" />
                <label htmlFor="dark" className="flex flex-col items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-300 peer-checked:border-blue-500 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-900/20">
                  <div className="w-16 h-12 bg-gray-800 border border-gray-600 rounded shadow-sm flex items-center justify-center">
                    <div className="w-8 h-2 bg-gray-600 rounded"></div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>🌙</span>
                    <span>Dark Mode</span>
                  </div>
                </label>
              </div>
              <div className="relative">
                <input type="radio" name="theme" id="auto" className="sr-only peer" />
                <label htmlFor="auto" className="flex flex-col items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-300 peer-checked:border-blue-500 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-900/20">
                  <div className="w-16 h-12 border border-gray-300 dark:border-gray-600 rounded shadow-sm flex">
                    <div className="w-8 h-full bg-white flex items-center justify-center">
                      <div className="w-3 h-1 bg-gray-300 rounded"></div>
                    </div>
                    <div className="w-8 h-full bg-gray-800 flex items-center justify-center">
                      <div className="w-3 h-1 bg-gray-600 rounded"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>🔄</span>
                    <span>Auto</span>
                  </div>
                </label>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Auto mode follows your system preference
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Accent Color
            </label>
            <div className="flex gap-3 flex-wrap">
              {[
                { name: 'Blue', color: 'bg-blue-500', selected: true },
                { name: 'Purple', color: 'bg-purple-500', selected: false },
                { name: 'Green', color: 'bg-green-500', selected: false },
                { name: 'Red', color: 'bg-red-500', selected: false },
                { name: 'Orange', color: 'bg-orange-500', selected: false },
                { name: 'Pink', color: 'bg-pink-500', selected: false },
              ].map((color) => (
                <div key={color.name} className="relative">
                  <input
                    type="radio"
                    name="accent"
                    id={color.name.toLowerCase()}
                    defaultChecked={color.selected}
                    className="sr-only peer"
                  />
                  <label
                    htmlFor={color.name.toLowerCase()}
                    className="flex items-center justify-center w-10 h-10 rounded-full cursor-pointer border-2 border-transparent peer-checked:border-gray-400 dark:peer-checked:border-gray-300"
                  >
                    <div className={`w-8 h-8 rounded-full ${color.color}`}></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button>Save Changes</Button>
            <Button variant="ghost">Reset to Default</Button>
          </div>
        </CardContent>
      </Card>

      {/* Typography Settings */}
      <Card>
        <CardHeader>
          <CardTitle>📖 Typography</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Interface Font Family
              </label>
              <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <option selected>Inter (Default)</option>
                <option>System UI</option>
                <option>Roboto</option>
                <option>Open Sans</option>
                <option>Lato</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Interface Font Size
              </label>
              <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <option>Small (13px)</option>
                <option selected>Medium (14px)</option>
                <option>Large (16px)</option>
                <option>Extra Large (18px)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Font Weight
            </label>
            <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              <option>Light (300)</option>
              <option selected>Regular (400)</option>
              <option>Medium (500)</option>
              <option>Semi-bold (600)</option>
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">High Contrast Mode</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Increase contrast for better readability</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Reduce Motion</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Minimize animations and transitions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout Settings */}
      <Card>
        <CardHeader>
          <CardTitle>📐 Layout & Spacing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Content Width
            </label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Narrow</span>
              <input type="range" min="1" max="3" defaultValue="2" className="flex-1" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Wide</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Sidebar Width
            </label>
            <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              <option>Narrow (200px)</option>
              <option selected>Standard (240px)</option>
              <option>Wide (280px)</option>
              <option>Extra Wide (320px)</option>
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Compact Mode</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reduce padding and spacing</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}