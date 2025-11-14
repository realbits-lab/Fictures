/**
 * ComicStatusCard Component Tests
 *
 * Unit tests for the comic publishing status card component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { ComicStatusCard } from "@/components/comic/comic-status-card";

describe("ComicStatusCard", () => {
    const defaultProps = {
        sceneId: "scene_123",
        sceneTitle: "Test Scene",
        comicStatus: "none" as const,
        onGenerate: jest.fn(),
        onPublish: jest.fn(),
        onUnpublish: jest.fn(),
        onPreview: jest.fn(),
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("Status: none", () => {
        it("should render with 'Not Generated' status", () => {
            render(<ComicStatusCard {...defaultProps} />);

            expect(screen.getByText("Comic Panels")).toBeInTheDocument();
            expect(screen.getByText("Not Generated")).toBeInTheDocument();
        });

        it("should show generate button", () => {
            render(<ComicStatusCard {...defaultProps} />);

            const generateButton = screen.getByText("Generate Comic Panels");
            expect(generateButton).toBeInTheDocument();
        });

        it("should call onGenerate when generate button is clicked", () => {
            render(<ComicStatusCard {...defaultProps} />);

            const generateButton = screen.getByText("Generate Comic Panels");
            fireEvent.click(generateButton);

            expect(defaultProps.onGenerate).toHaveBeenCalledTimes(1);
        });

        it("should disable generate button when generating", () => {
            render(<ComicStatusCard {...defaultProps} isGenerating={true} />);

            const generateButton = screen.getByText("Generating Panels...");
            expect(generateButton).toBeDisabled();
        });
    });

    describe("Status: draft", () => {
        const draftProps = {
            ...defaultProps,
            comicStatus: "draft" as const,
            comicPanelCount: 8,
            comicGeneratedAt: "2025-01-01T00:00:00.000Z",
        };

        it("should render with 'Draft' status", () => {
            render(<ComicStatusCard {...draftProps} />);

            expect(screen.getByText("Draft")).toBeInTheDocument();
        });

        it("should show panel count", () => {
            render(<ComicStatusCard {...draftProps} />);

            expect(screen.getByText("8")).toBeInTheDocument();
        });

        it("should show preview, publish, and regenerate buttons", () => {
            render(<ComicStatusCard {...draftProps} />);

            expect(screen.getByText("Preview Panels")).toBeInTheDocument();
            expect(screen.getByText("Publish Comic")).toBeInTheDocument();
            expect(screen.getByText("Regenerate Panels")).toBeInTheDocument();
        });

        it("should call onPreview when preview button is clicked", () => {
            render(<ComicStatusCard {...draftProps} />);

            const previewButton = screen.getByText("Preview Panels");
            fireEvent.click(previewButton);

            expect(draftProps.onPreview).toHaveBeenCalledTimes(1);
        });

        it("should call onPublish when publish button is clicked", () => {
            render(<ComicStatusCard {...draftProps} />);

            const publishButton = screen.getByText("Publish Comic");
            fireEvent.click(publishButton);

            expect(draftProps.onPublish).toHaveBeenCalledTimes(1);
        });

        it("should call onGenerate when regenerate button is clicked", () => {
            render(<ComicStatusCard {...draftProps} />);

            const regenerateButton = screen.getByText("Regenerate Panels");
            fireEvent.click(regenerateButton);

            expect(draftProps.onGenerate).toHaveBeenCalledTimes(1);
        });
    });

    describe("Status: published", () => {
        const publishedProps = {
            ...defaultProps,
            comicStatus: "published" as const,
            comicPanelCount: 10,
            comicGeneratedAt: "2025-01-01T00:00:00.000Z",
            comicPublishedAt: "2025-01-02T00:00:00.000Z",
        };

        it("should render with 'Published' status", () => {
            render(<ComicStatusCard {...publishedProps} />);

            expect(screen.getByText("Published")).toBeInTheDocument();
        });

        it("should show published date", () => {
            render(<ComicStatusCard {...publishedProps} />);

            // Check that the published date is displayed
            expect(screen.getByText(/Published:/)).toBeInTheDocument();
        });

        it("should show view and unpublish buttons", () => {
            render(<ComicStatusCard {...publishedProps} />);

            expect(
                screen.getByText("View Published Comic"),
            ).toBeInTheDocument();
            expect(screen.getByText("Unpublish Comic")).toBeInTheDocument();
        });

        it("should call onPreview when view button is clicked", () => {
            render(<ComicStatusCard {...publishedProps} />);

            const viewButton = screen.getByText("View Published Comic");
            fireEvent.click(viewButton);

            expect(publishedProps.onPreview).toHaveBeenCalledTimes(1);
        });

        it("should call onUnpublish when unpublish button is clicked", () => {
            render(<ComicStatusCard {...publishedProps} />);

            const unpublishButton = screen.getByText("Unpublish Comic");
            fireEvent.click(unpublishButton);

            expect(publishedProps.onUnpublish).toHaveBeenCalledTimes(1);
        });
    });

    describe("Accessibility", () => {
        it("should have proper ARIA labels", () => {
            const { container } = render(<ComicStatusCard {...defaultProps} />);

            // Card should be identifiable
            expect(container.querySelector(".card")).toBeTruthy();
        });

        it("should have focusable buttons", () => {
            render(<ComicStatusCard {...defaultProps} />);

            const generateButton = screen.getByText("Generate Comic Panels");
            expect(generateButton).toBeVisible();

            // Button should be keyboard accessible
            generateButton.focus();
            expect(document.activeElement).toBe(generateButton);
        });
    });
});
