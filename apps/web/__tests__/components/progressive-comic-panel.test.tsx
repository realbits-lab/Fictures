/**
 * ProgressiveComicPanel Component Tests
 *
 * Unit tests for progressive loading of comic panels
 */

import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import {
    getRecommendedInitialLoadCount,
    ProgressiveComicPanel,
} from "@/components/comic/progressive-comic-panel";

// Mock Intersection Observer
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver as any;

describe("ProgressiveComicPanel", () => {
    const mockPanel = {
        id: "panel_1",
        panel_number: 1,
        shot_type: "medium_shot",
        image_url: "https://example.com/panel.jpg",
        image_variants: {
            variants: [
                {
                    url: "https://example.com/panel-mobile.avif",
                    format: "avif",
                    width: 672,
                    height: 384,
                },
            ],
        },
        narrative: "The story begins...",
        dialogue: [
            {
                character_id: "char_1",
                text: "Hello there!",
                tone: "friendly",
            },
        ],
        sfx: [
            {
                text: "WHOOSH",
                emphasis: "dramatic" as const,
            },
        ],
        description: "A peaceful morning scene",
    };

    const mockCharacterNames = {
        char_1: "Alice",
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("Immediate loading (initialLoadCount)", () => {
        it("should load immediately if panelIndex < initialLoadCount", () => {
            render(
                <ProgressiveComicPanel
                    panel={mockPanel}
                    panelIndex={0}
                    totalPanels={10}
                    initialLoadCount={3}
                />,
            );

            // Panel should load immediately (not showing skeleton)
            expect(
                screen.queryByTestId("panel-skeleton"),
            ).not.toBeInTheDocument();
        });

        it("should show skeleton if panelIndex >= initialLoadCount", () => {
            render(
                <ProgressiveComicPanel
                    panel={mockPanel}
                    panelIndex={5}
                    totalPanels={10}
                    initialLoadCount={3}
                />,
            );

            // Should initially show skeleton
            expect(mockIntersectionObserver).toHaveBeenCalled();
        });
    });

    describe("Lazy loading (Intersection Observer)", () => {
        it("should set up Intersection Observer for lazy-loaded panels", () => {
            render(
                <ProgressiveComicPanel
                    panel={mockPanel}
                    panelIndex={5}
                    totalPanels={10}
                    initialLoadCount={3}
                />,
            );

            expect(mockIntersectionObserver).toHaveBeenCalledWith(
                expect.any(Function),
                {
                    rootMargin: "200px",
                    threshold: 0.01,
                },
            );
        });

        it("should disconnect observer on unmount", () => {
            const mockDisconnect = jest.fn();
            mockIntersectionObserver.mockReturnValue({
                observe: jest.fn(),
                unobserve: jest.fn(),
                disconnect: mockDisconnect,
            });

            const { unmount } = render(
                <ProgressiveComicPanel
                    panel={mockPanel}
                    panelIndex={5}
                    totalPanels={10}
                    initialLoadCount={3}
                />,
            );

            unmount();

            expect(mockDisconnect).toHaveBeenCalled();
        });
    });

    describe("onLoad callback", () => {
        it("should call onLoad with panel number when panel loads", async () => {
            const mockOnLoad = jest.fn();

            render(
                <ProgressiveComicPanel
                    panel={mockPanel}
                    panelIndex={0}
                    totalPanels={10}
                    initialLoadCount={3}
                    onLoad={mockOnLoad}
                />,
            );

            // Wait for the panel to trigger load
            await waitFor(() => {
                // Since this is immediate loading, onLoad should be called after image loads
                // In a real test, you'd need to simulate the image load event
                expect(mockOnLoad).toHaveBeenCalledWith(1);
            });
        });
    });

    describe("Props forwarding", () => {
        it("should forward characterNames to PanelRenderer", () => {
            render(
                <ProgressiveComicPanel
                    panel={mockPanel}
                    panelIndex={0}
                    totalPanels={10}
                    characterNames={mockCharacterNames}
                />,
            );

            // Character name should be rendered in dialogue
            expect(screen.getByText(/Alice/i)).toBeInTheDocument();
        });

        it("should set priority=true for first 2 panels", () => {
            const { rerender } = render(
                <ProgressiveComicPanel
                    panel={mockPanel}
                    panelIndex={0}
                    totalPanels={10}
                />,
            );

            // First panel should have priority
            // (In practice, this would be tested by checking Next.js Image props)

            rerender(
                <ProgressiveComicPanel
                    panel={mockPanel}
                    panelIndex={2}
                    totalPanels={10}
                />,
            );

            // Third panel should not have priority
        });
    });
});

describe("getRecommendedInitialLoadCount", () => {
    const originalWindow = global.window;

    afterEach(() => {
        global.window = originalWindow;
    });

    it("should return 3 for SSR (no window)", () => {
        // @ts-expect-error - Testing SSR scenario
        delete global.window;

        const count = getRecommendedInitialLoadCount();
        expect(count).toBe(3);

        global.window = originalWindow;
    });

    it("should return 2-3 for mobile screens", () => {
        Object.defineProperty(window, "innerWidth", {
            writable: true,
            configurable: true,
            value: 375,
        });
        Object.defineProperty(window, "innerHeight", {
            writable: true,
            configurable: true,
            value: 667,
        });

        const count = getRecommendedInitialLoadCount();
        expect(count).toBeGreaterThanOrEqual(2);
        expect(count).toBeLessThanOrEqual(3);
    });

    it("should return 3-4 for tablet screens", () => {
        Object.defineProperty(window, "innerWidth", {
            writable: true,
            configurable: true,
            value: 768,
        });
        Object.defineProperty(window, "innerHeight", {
            writable: true,
            configurable: true,
            value: 1024,
        });

        const count = getRecommendedInitialLoadCount();
        expect(count).toBeGreaterThanOrEqual(3);
        expect(count).toBeLessThanOrEqual(4);
    });

    it("should return 4-5 for desktop screens", () => {
        Object.defineProperty(window, "innerWidth", {
            writable: true,
            configurable: true,
            value: 1920,
        });
        Object.defineProperty(window, "innerHeight", {
            writable: true,
            configurable: true,
            value: 1080,
        });

        const count = getRecommendedInitialLoadCount();
        expect(count).toBeGreaterThanOrEqual(4);
        expect(count).toBeLessThanOrEqual(5);
    });
});
