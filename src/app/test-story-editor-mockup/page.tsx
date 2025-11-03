'use client';

import { useState, useEffect, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export default function TestStoryEditorMockup() {
  const [currentSelection, setCurrentSelection] = useState<any>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const middlePanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const rightChatRef = useRef<HTMLDivElement>(null);

  // Completely isolate wheel events for each panel
  useEffect(() => {
    const panels = [leftPanelRef.current, middlePanelRef.current, rightChatRef.current];

    const handleWheel = (e: WheelEvent) => {
      // ALWAYS prevent default and stop propagation to completely isolate wheel events
      e.preventDefault();
      e.stopPropagation();

      const target = e.currentTarget as HTMLElement;
      const { scrollTop, scrollHeight, clientHeight } = target;
      const canScroll = scrollHeight > clientHeight;

      // If element can scroll, manually update scrollTop
      if (canScroll) {
        const newScrollTop = scrollTop + e.deltaY;
        const maxScroll = scrollHeight - clientHeight;

        // Clamp scroll position to valid range
        target.scrollTop = Math.max(0, Math.min(maxScroll, newScrollTop));
      }
      // If element cannot scroll, do nothing (event is already prevented)
    };

    panels.forEach((panel) => {
      if (panel) {
        panel.addEventListener('wheel', handleWheel, { passive: false, capture: true });
      }
    });

    return () => {
      panels.forEach((panel) => {
        if (panel) {
          panel.removeEventListener('wheel', handleWheel, { capture: true });
        }
      });
    };
  }, []);

  // Mock story data
  const mockStory = {
    id: 'test-story-1',
    title: 'Test Story for Scroll Testing',
    genre: 'Fantasy',
    status: 'draft',
  };

  return (
    <>
      <style jsx global>{`
        html, body {
          overflow: hidden;
          height: 100%;
          overscroll-behavior: none;
        }
      `}</style>
      <div className="h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="flex-shrink-0 border-b p-4 bg-card">
          <h1 className="text-2xl font-bold">Story Editor Mockup - Scroll Test</h1>
          <p className="text-sm text-muted-foreground">Testing independent vertical scrolling in right sidebar</p>
        </div>

      {/* Main Content Area with PanelGroup */}
      <div className="flex-1 min-h-0 px-4 py-6 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Left Sidebar - Story Tree */}
          <Panel defaultSize={20} minSize={15} maxSize={30} style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              ref={leftPanelRef}
              className="flex-1 min-h-0 pr-2 overflow-y-auto [overscroll-behavior-y:contain]"
              onWheel={(e) => e.stopPropagation()}
            >
              <div className="space-y-2">
                <div className="font-bold text-lg mb-4">Story Structure</div>
                {Array.from({ length: 50 }, (_, i) => (
                  <div
                    key={i}
                    className="p-2 rounded hover:bg-accent cursor-pointer"
                    onClick={() => setCurrentSelection({ type: 'chapter', id: i })}
                  >
                    <div className="font-medium">Chapter {i + 1}</div>
                    <div className="text-xs text-muted-foreground">Scene content...</div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-300 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-400 transition-colors cursor-col-resize" />

          {/* Middle Panel - Editor */}
          <Panel defaultSize={55} minSize={40} style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              ref={middlePanelRef}
              className="flex-1 min-h-0 px-2 overflow-y-auto [overscroll-behavior-y:contain]"
              onWheel={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <div className="font-bold text-xl mb-4">Editor Area</div>
                <div className="text-sm text-muted-foreground mb-4">
                  ⬇️ SCROLL THIS AREA - Page should NOT scroll
                </div>
                {Array.from({ length: 100 }, (_, i) => (
                  <div key={i} className="p-4 border rounded">
                    <h3 className="font-semibold">Paragraph {i + 1}</h3>
                    <p className="text-sm text-muted-foreground">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-300 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-400 transition-colors cursor-col-resize" />

          {/* Right Sidebar - Mock Chat with Scrollable Messages */}
          <Panel defaultSize={25} minSize={15} maxSize={40} style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="h-full pl-2 flex flex-col">
              <div
                ref={rightChatRef}
                className="flex-1 p-4 overflow-y-auto text-foreground min-h-0 [overscroll-behavior-y:contain]"
              >
                <div className="font-bold text-lg mb-4">AI Assistant Chat</div>
                <div className="text-sm text-muted-foreground mb-4">
                  ⬇️ SCROLL THIS CHAT - Other panels should NOT scroll
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 30 }, (_, i) => (
                    <div key={i} className={`p-3 rounded ${i % 2 === 0 ? 'bg-primary/10 ml-4' : 'bg-muted mr-4'}`}>
                      <div className="font-medium text-xs mb-1">
                        {i % 2 === 0 ? '🤖 AI Assistant' : '👤 You'}
                      </div>
                      <p className="text-sm">
                        {i % 2 === 0
                          ? `This is AI message ${Math.floor(i / 2) + 1}. I can help you write your story, suggest plot points, develop characters, and more. Let me know what you need!`
                          : `This is user message ${Math.floor(i / 2) + 1}. Can you help me with this chapter?`
                        }
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input Box */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask AI assistant..."
                    className="flex-1 px-3 py-2 text-sm border border-input rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded hover:bg-primary/90">
                    Send
                  </button>
                </div>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Scroll Indicator */}
      <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50">
        <div id="scroll-indicator">
          Page Scroll: <span id="scroll-value">0</span>px
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('scroll', () => {
              const indicator = document.getElementById('scroll-value');
              if (indicator) indicator.textContent = window.scrollY;
            });
            setInterval(() => {
              const indicator = document.getElementById('scroll-value');
              if (indicator) indicator.textContent = window.scrollY;
            }, 100);
          `,
        }}
      />
    </div>
    </>
  );
}
