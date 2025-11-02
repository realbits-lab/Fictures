'use client';

import { useEffect, useRef } from 'react';

function ScrollablePanel({ title, position }: { title: string; position: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex-1 border-2 border-blue-500 overflow-y-auto [overscroll-behavior-y:contain]"
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4 sticky top-0 bg-white dark:bg-gray-900 pb-2">
          {title} ({position})
        </h2>
        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
          Scroll here - page should NOT scroll
        </p>
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} className="p-2 mb-2 bg-gray-100 dark:bg-gray-800 rounded">
            Item {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TestScrollIsolationPage() {
  // Prevent body scroll on mount
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">Scroll Isolation Test</h1>
        <p className="text-sm">The page should NEVER scroll. Only panels should scroll.</p>
      </div>

      {/* Main Content - This should NOT scroll */}
      <div className="flex-1 min-h-0 p-4 overflow-hidden"
        onWheel={(e) => {
          // Prevent wheel events from reaching the window if not already handled by panels
          const target = e.target as HTMLElement;
          if (!target.closest('.overflow-y-auto')) {
            e.preventDefault();
          }
        }}
      >
        <div className="h-full flex gap-4">
          <ScrollablePanel title="Left Panel" position="overflow-hidden applied to parent" />
          <ScrollablePanel title="Middle Panel" position="with wheel event stopPropagation" />
          <ScrollablePanel title="Right Panel" position="testing scroll isolation" />
        </div>
      </div>

      {/* Page Scroll Indicator */}
      <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg">
        <div id="scroll-indicator">
          Page Scroll: <span id="scroll-value">0</span>px
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('scroll', () => {
              document.getElementById('scroll-value').textContent = window.scrollY;
            });
            setInterval(() => {
              document.getElementById('scroll-value').textContent = window.scrollY;
            }, 100);
          `,
        }}
      />
    </div>
  );
}
