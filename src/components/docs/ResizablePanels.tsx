'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';

interface ResizablePanelsProps {
  leftPanel: ReactNode;
  middlePanel: ReactNode;
  rightPanel: ReactNode;
  defaultLeftWidth?: number;
  defaultRightWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
  minRightWidth?: number;
  maxRightWidth?: number;
}

export function ResizablePanels({
  leftPanel,
  middlePanel,
  rightPanel,
  defaultLeftWidth = 256,
  defaultRightWidth = 256,
  minLeftWidth = 200,
  maxLeftWidth = 400,
  minRightWidth = 200,
  maxRightWidth = 400,
}: ResizablePanelsProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [rightWidth, setRightWidth] = useState(defaultRightWidth);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Panel refs for independent scrolling
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const middlePanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Load saved widths from localStorage
  useEffect(() => {
    const savedLeftWidth = localStorage.getItem('docs-left-panel-width');
    const savedRightWidth = localStorage.getItem('docs-right-panel-width');

    if (savedLeftWidth) {
      const width = parseInt(savedLeftWidth, 10);
      if (width >= minLeftWidth && width <= maxLeftWidth) {
        setLeftWidth(width);
      }
    }

    if (savedRightWidth) {
      const width = parseInt(savedRightWidth, 10);
      if (width >= minRightWidth && width <= maxRightWidth) {
        setRightWidth(width);
      }
    }
  }, [minLeftWidth, maxLeftWidth, minRightWidth, maxRightWidth]);

  // Handle left divider drag
  useEffect(() => {
    if (!isDraggingLeft) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      if (newWidth >= minLeftWidth && newWidth <= maxLeftWidth) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      localStorage.setItem('docs-left-panel-width', leftWidth.toString());
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingLeft, leftWidth, minLeftWidth, maxLeftWidth]);

  // Handle right divider drag
  useEffect(() => {
    if (!isDraggingRight) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = containerRect.right - e.clientX;

      if (newWidth >= minRightWidth && newWidth <= maxRightWidth) {
        setRightWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingRight(false);
      localStorage.setItem('docs-right-panel-width', rightWidth.toString());
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingRight, rightWidth, minRightWidth, maxRightWidth]);

  // Independent scrolling implementation
  useEffect(() => {
    const panels = [leftPanelRef.current, middlePanelRef.current, rightPanelRef.current];

    const handleWheel = (e: WheelEvent) => {
      // ALWAYS prevent default and stop propagation
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
      // If element cannot scroll, do nothing (event already prevented)
    };

    panels.forEach((panel) => {
      if (panel) {
        // Capture phase ensures we intercept events before child elements
        panel.addEventListener('wheel', handleWheel, {
          passive: false,
          capture: true,
        });
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

  return (
    <>
      {/* Global scroll prevention */}
      <style jsx global>{`
        html,
        body {
          overflow: hidden;
          height: 100%;
          overscroll-behavior: none;
        }
      `}</style>
    <div
      ref={containerRef}
      className="flex-1 flex overflow-hidden"
      style={{ cursor: isDraggingLeft || isDraggingRight ? 'col-resize' : 'default' }}
    >
      {/* Left Panel */}
      <aside
        className="hidden lg:flex flex-shrink-0 border-r border-gray-200 dark:border-gray-800"
        style={{ width: `${leftWidth}px` }}
      >
        <div
          ref={leftPanelRef}
          className="flex-1 min-h-0 overflow-y-auto [overscroll-behavior-y:contain] px-4 py-6"
        >
          {leftPanel}
        </div>
      </aside>

      {/* Left Divider */}
      <div
        className="hidden lg:block w-1 hover:w-1.5 bg-transparent hover:bg-blue-500/50 transition-all cursor-col-resize flex-shrink-0"
        onMouseDown={() => setIsDraggingLeft(true)}
        title="Drag to resize"
      />

      {/* Middle Panel */}
      <main
        ref={middlePanelRef}
        className="flex-1 min-h-0 overflow-y-auto [overscroll-behavior-y:contain]"
      >
        <div className="container mx-auto max-w-4xl px-4 py-6">
          {middlePanel}
        </div>
      </main>

      {/* Right Divider */}
      <div
        className="hidden xl:block w-1 hover:w-1.5 bg-transparent hover:bg-blue-500/50 transition-all cursor-col-resize flex-shrink-0"
        onMouseDown={() => setIsDraggingRight(true)}
        title="Drag to resize"
      />

      {/* Right Panel */}
      <aside
        className="hidden xl:flex flex-shrink-0 border-l border-gray-200 dark:border-gray-800"
        style={{ width: `${rightWidth}px` }}
      >
        <div
          ref={rightPanelRef}
          className="flex-1 min-h-0 overflow-y-auto [overscroll-behavior-y:contain] px-4 py-6"
        >
          {rightPanel}
        </div>
      </aside>
    </div>
    </>
  );
}
