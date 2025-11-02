'use client';

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export default function TestChatScrollingPage() {
  // Generate dummy messages
  const messages = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `This is test message #${i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`
  }));

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 p-4 flex flex-col">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold">Test Chat Panel Scrolling</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Only the messages area should scroll, input should stay fixed at bottom
        </p>
      </div>

      <div className="border-2 border-blue-500 flex-1 min-h-0">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Left Panel */}
          <Panel defaultSize={25} minSize={15} style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="h-full pr-2 overflow-y-auto bg-gray-100 dark:bg-gray-800">
              <div className="p-4">
                <h3 className="font-bold mb-2">Left Sidebar</h3>
                {Array.from({ length: 100 }, (_, i) => (
                  <div key={i} className="mb-2">Item {i + 1}</div>
                ))}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-300 dark:bg-gray-700 hover:bg-blue-500 transition-colors cursor-col-resize" />

          {/* Middle Panel */}
          <Panel defaultSize={50} minSize={30} style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="h-full px-2 overflow-y-auto bg-white dark:bg-gray-900">
              <div className="p-4">
                <h3 className="font-bold mb-2">Middle Content</h3>
                {Array.from({ length: 100 }, (_, i) => (
                  <div key={i} className="mb-2">Content {i + 1}</div>
                ))}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-300 dark:bg-gray-700 hover:bg-blue-500 transition-colors cursor-col-resize" />

          {/* Right Panel - Chat Interface */}
          <Panel defaultSize={25} minSize={15} style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="h-full pl-2">
              {/* Chat Component - flexbox container */}
              <div className="h-full flex flex-col bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded">
                {/* Messages Area - SCROLLABLE */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-blue-50 dark:bg-blue-950/20">
                  <div className="space-y-4">
                    <div className="text-xs text-gray-500 mb-4">↓ SCROLL THIS AREA ONLY ↓</div>
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded ${
                          msg.role === 'user'
                            ? 'bg-blue-500 text-white ml-8'
                            : 'bg-gray-200 dark:bg-gray-700 mr-8'
                        }`}
                      >
                        <div className="text-xs font-bold mb-1">{msg.role.toUpperCase()}</div>
                        {msg.content}
                      </div>
                    ))}
                    <div className="text-xs text-gray-500 mt-4">↑ END OF MESSAGES ↑</div>
                  </div>
                </div>

                {/* Input Area - FIXED AT BOTTOM */}
                <div className="flex-shrink-0 border-t border-gray-300 dark:border-gray-700 p-4 bg-yellow-50 dark:bg-yellow-950/20">
                  <div className="text-xs text-gray-500 mb-2">↓ THIS SHOULD STAY VISIBLE ↓</div>
                  <div className="flex gap-2">
                    <textarea
                      className="flex-1 resize-none rounded border border-gray-300 dark:border-gray-600 p-2 min-h-[60px]"
                      placeholder="Type your message..."
                      rows={2}
                    />
                    <button className="px-4 py-2 bg-blue-500 text-white rounded shrink-0">
                      Send
                    </button>
                  </div>
                  <p className="text-xs text-center mt-2 text-gray-500">
                    Press Enter to send
                  </p>
                </div>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded flex-shrink-0">
        <h3 className="font-bold mb-2">Testing Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Hover over the RIGHT panel (chat area with blue background)</li>
          <li>Scroll with mouse wheel - ONLY the messages area should scroll</li>
          <li>The yellow input box at bottom should ALWAYS stay visible</li>
          <li>The entire page should NOT scroll</li>
          <li>Other panels (left, middle) should NOT scroll when hovering right panel</li>
        </ol>
      </div>
    </div>
  );
}
