import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";
import { ThemeSelector } from "@/components/settings/ThemeSelector";

export default function AppearancePage() {
  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle>🎨 Theme & Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeSelector />
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
              <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2">
                Interface Font Family
              </label>
              <select className="w-full px-3 py-2 border border-[rgb(var(--input))] rounded-lg bg-[rgb(var(--background))] text-[rgb(var(--foreground))]" defaultValue="Inter (Default)">
                <option>Inter (Default)</option>
                <option>System UI</option>
                <option>Roboto</option>
                <option>Open Sans</option>
                <option>Lato</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2">
                Interface Font Size
              </label>
              <select className="w-full px-3 py-2 border border-[rgb(var(--input))] rounded-lg bg-[rgb(var(--background))] text-[rgb(var(--foreground))]" defaultValue="Medium (14px)">
                <option>Small (13px)</option>
                <option>Medium (14px)</option>
                <option>Large (16px)</option>
                <option>Extra Large (18px)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2">
              Font Weight
            </label>
            <select className="w-full px-3 py-2 border border-[rgb(var(--input))] rounded-lg bg-[rgb(var(--background))] text-[rgb(var(--foreground))]" defaultValue="Regular (400)">
              <option>Light (300)</option>
              <option>Regular (400)</option>
              <option>Medium (500)</option>
              <option>Semi-bold (600)</option>
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-[rgb(var(--foreground))]">High Contrast Mode</h4>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Increase contrast for better readability</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-[rgb(var(--muted))] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[rgb(var(--primary)/30%)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[rgb(var(--border))] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--primary))]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-[rgb(var(--foreground))]">Reduce Motion</h4>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Minimize animations and transitions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-[rgb(var(--muted))] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[rgb(var(--primary)/30%)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[rgb(var(--border))] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--primary))]"></div>
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
            <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2">
              Content Width
            </label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[rgb(var(--muted-foreground))]">Narrow</span>
              <input type="range" min="1" max="3" defaultValue="2" className="flex-1" />
              <span className="text-sm text-[rgb(var(--muted-foreground))]">Wide</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2">
              Sidebar Width
            </label>
            <select className="w-full px-3 py-2 border border-[rgb(var(--input))] rounded-lg bg-[rgb(var(--background))] text-[rgb(var(--foreground))]" defaultValue="Standard (240px)">
              <option>Narrow (200px)</option>
              <option>Standard (240px)</option>
              <option>Wide (280px)</option>
              <option>Extra Wide (320px)</option>
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-[rgb(var(--foreground))]">Compact Mode</h4>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Reduce padding and spacing</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-[rgb(var(--muted))] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[rgb(var(--primary)/30%)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[rgb(var(--border))] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--primary))]"></div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}