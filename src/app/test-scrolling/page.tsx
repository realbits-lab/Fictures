"use client";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

/**
 * Mockup page to test independent panel scrolling
 * This isolates the scrolling issue without complex story editor logic
 */

export default function TestScrollingPage() {
  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 p-4 flex flex-col">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold">Test Independent Panel Scrolling</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Each panel should scroll independently when you hover and use mouse wheel
        </p>
      </div>

      <div className="border-2 border-blue-500 flex-1 min-h-0">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Left Panel */}
          <Panel
            defaultSize={33}
            minSize={20}
            maxSize={50}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <div className="flex-1 min-h-0 pr-2 overflow-y-auto bg-red-50 dark:bg-red-900/20" style={{ height: '100%' }}>
              <div className="p-4">
                <h2 className="text-xl font-bold mb-2 sticky top-0 bg-red-100 dark:bg-red-800 p-2">
                  LEFT PANEL
                </h2>
                <div className="space-y-4">
                  {Array.from({ length: 50 }, (_, i) => (
                    <div key={i} className="p-3 bg-white dark:bg-gray-800 rounded shadow">
                      Left Panel Item {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-300 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-400 transition-colors cursor-col-resize" />

          {/* Middle Panel */}
          <Panel
            defaultSize={34}
            minSize={20}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <div className="flex-1 min-h-0 px-2 overflow-y-auto bg-green-50 dark:bg-green-900/20" style={{ height: '100%' }}>
              <div className="p-4">
                <h2 className="text-xl font-bold mb-2 sticky top-0 bg-green-100 dark:bg-green-800 p-2">
                  MIDDLE PANEL
                </h2>
                <div className="space-y-4">
                  {Array.from({ length: 50 }, (_, i) => (
                    <div key={i} className="p-3 bg-white dark:bg-gray-800 rounded shadow">
                      Middle Panel Item {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-300 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-400 transition-colors cursor-col-resize" />

          {/* Right Panel */}
          <Panel
            defaultSize={33}
            minSize={20}
            maxSize={50}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <div className="flex-1 min-h-0 pl-2 overflow-y-auto bg-blue-50 dark:bg-blue-900/20" style={{ height: '100%' }}>
              <div className="p-4">
                <h2 className="text-xl font-bold mb-2 sticky top-0 bg-blue-100 dark:bg-blue-800 p-2">
                  RIGHT PANEL
                </h2>
                <div className="space-y-4">
                  {Array.from({ length: 50 }, (_, i) => (
                    <div key={i} className="p-3 bg-white dark:bg-gray-800 rounded shadow">
                      Right Panel Item {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded flex-shrink-0">
        <h3 className="font-bold mb-2">Testing Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Hover your mouse over the LEFT panel and scroll with mouse wheel - only left should scroll</li>
          <li>Hover your mouse over the MIDDLE panel and scroll with mouse wheel - only middle should scroll</li>
          <li>Hover your mouse over the RIGHT panel and scroll with mouse wheel - only right should scroll</li>
          <li>Try dragging the resize handles between panels - they should resize smoothly</li>
        </ol>
      </div>
    </div>
  );
}
