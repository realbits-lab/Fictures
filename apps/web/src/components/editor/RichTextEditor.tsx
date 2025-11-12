"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect } from "react";

interface RichTextEditorProps {
    content?: string;
    placeholder?: string;
    onChange?: (html: string, markdown: string) => void;
    onImageUpload?: (file: File) => Promise<string>;
    mentions?: Array<{ id: string; label: string }>;
    className?: string;
    editable?: boolean;
}

export function RichTextEditor({
    content = "",
    placeholder = "Write your content here...",
    onChange,
    onImageUpload,
    mentions = [],
    className = "",
    editable = true,
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-blue-600 hover:text-blue-800 underline",
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            Mention.configure({
                HTMLAttributes: {
                    class: "mention text-blue-600 font-medium",
                },
                suggestion: {
                    items: ({ query }: { query: string }) => {
                        return mentions
                            .filter((item) =>
                                item.label
                                    .toLowerCase()
                                    .startsWith(query.toLowerCase()),
                            )
                            .slice(0, 5);
                    },
                },
            }),
        ],
        content,
        editable,
        editorProps: {
            attributes: {
                class: `prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none ${className}`,
            },
        },
        onUpdate: ({ editor }) => {
            if (onChange) {
                const html = editor.getHTML();
                const markdown = convertHtmlToMarkdown(html);
                onChange(html, markdown);
            }
        },
    });

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    const handleImageUpload = useCallback(async () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file && onImageUpload && editor) {
                try {
                    const url = await onImageUpload(file);
                    editor.chain().focus().setImage({ src: url }).run();
                } catch (error) {
                    console.error("Image upload failed:", error);
                }
            }
        };
        input.click();
    }, [editor, onImageUpload]);

    const setLink = useCallback(() => {
        if (!editor) return;

        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("URL", previousUrl);

        if (url === null) return;

        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }

        editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url })
            .run();
    }, [editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            {editable && (
                <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
                    <EditorButton
                        onClick={() =>
                            editor.chain().focus().toggleBold().run()
                        }
                        isActive={editor.isActive("bold")}
                        title="Bold"
                    >
                        <strong>B</strong>
                    </EditorButton>

                    <EditorButton
                        onClick={() =>
                            editor.chain().focus().toggleItalic().run()
                        }
                        isActive={editor.isActive("italic")}
                        title="Italic"
                    >
                        <em>I</em>
                    </EditorButton>

                    <EditorButton
                        onClick={() =>
                            editor.chain().focus().toggleStrike().run()
                        }
                        isActive={editor.isActive("strike")}
                        title="Strikethrough"
                    >
                        <s>S</s>
                    </EditorButton>

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    <EditorButton
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleHeading({ level: 1 })
                                .run()
                        }
                        isActive={editor.isActive("heading", { level: 1 })}
                        title="Heading 1"
                    >
                        H1
                    </EditorButton>

                    <EditorButton
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleHeading({ level: 2 })
                                .run()
                        }
                        isActive={editor.isActive("heading", { level: 2 })}
                        title="Heading 2"
                    >
                        H2
                    </EditorButton>

                    <EditorButton
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleHeading({ level: 3 })
                                .run()
                        }
                        isActive={editor.isActive("heading", { level: 3 })}
                        title="Heading 3"
                    >
                        H3
                    </EditorButton>

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    <EditorButton
                        onClick={() =>
                            editor.chain().focus().toggleBulletList().run()
                        }
                        isActive={editor.isActive("bulletList")}
                        title="Bullet List"
                    >
                        •
                    </EditorButton>

                    <EditorButton
                        onClick={() =>
                            editor.chain().focus().toggleOrderedList().run()
                        }
                        isActive={editor.isActive("orderedList")}
                        title="Ordered List"
                    >
                        1.
                    </EditorButton>

                    <EditorButton
                        onClick={() =>
                            editor.chain().focus().toggleBlockquote().run()
                        }
                        isActive={editor.isActive("blockquote")}
                        title="Quote"
                    >
                        &ldquo;
                    </EditorButton>

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    <EditorButton
                        onClick={setLink}
                        isActive={editor.isActive("link")}
                        title="Link"
                    >
                        🔗
                    </EditorButton>

                    {onImageUpload && (
                        <EditorButton
                            onClick={handleImageUpload}
                            title="Upload Image"
                        >
                            🖼️
                        </EditorButton>
                    )}

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    <EditorButton
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        title="Undo"
                    >
                        ↶
                    </EditorButton>

                    <EditorButton
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        title="Redo"
                    >
                        ↷
                    </EditorButton>
                </div>
            )}

            <EditorContent
                editor={editor}
                className="p-4 min-h-[200px] max-h-[500px] overflow-y-auto"
            />
        </div>
    );
}

interface EditorButtonProps {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    title?: string;
    children: React.ReactNode;
}

function EditorButton({
    onClick,
    isActive = false,
    disabled = false,
    title,
    children,
}: EditorButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`
        px-2 py-1 rounded text-sm font-medium transition-colors
        ${
            isActive
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        border border-gray-300
      `}
        >
            {children}
        </button>
    );
}

/**
 * Convert Tiptap HTML to Markdown (simplified)
 * For production, consider using a library like turndown
 */
function convertHtmlToMarkdown(html: string): string {
    let markdown = html;

    // Remove wrapper paragraphs
    markdown = markdown.replace(/<p>/g, "").replace(/<\/p>/g, "\n\n");

    // Headings
    markdown = markdown.replace(/<h1>(.*?)<\/h1>/g, "# $1\n\n");
    markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, "## $1\n\n");
    markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, "### $1\n\n");

    // Bold
    markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, "**$1**");
    markdown = markdown.replace(/<b>(.*?)<\/b>/g, "**$1**");

    // Italic
    markdown = markdown.replace(/<em>(.*?)<\/em>/g, "*$1*");
    markdown = markdown.replace(/<i>(.*?)<\/i>/g, "*$1*");

    // Strikethrough
    markdown = markdown.replace(/<s>(.*?)<\/s>/g, "~~$1~~");

    // Links
    markdown = markdown.replace(
        /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g,
        "[$2]($1)",
    );

    // Images
    markdown = markdown.replace(
        /<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g,
        "![$2]($1)",
    );
    markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*>/g, "![]($1)");

    // Lists
    markdown = markdown.replace(
        /<ul>([\s\S]*?)<\/ul>/g,
        (_match: string, content: string) => {
            return content.replace(/<li>(.*?)<\/li>/g, "- $1\n");
        },
    );
    markdown = markdown.replace(
        /<ol>([\s\S]*?)<\/ol>/g,
        (_match: string, content: string) => {
            let counter = 1;
            return content.replace(
                /<li>(.*?)<\/li>/g,
                (_m: string, item: string) => {
                    return `${counter++}. ${item}\n`;
                },
            );
        },
    );

    // Blockquotes
    markdown = markdown.replace(
        /<blockquote>([\s\S]*?)<\/blockquote>/g,
        (_match: string, content: string) => {
            return (
                content
                    .split("\n")
                    .map((line: string) => `> ${line}`)
                    .join("\n") + "\n\n"
            );
        },
    );

    // Clean up extra newlines
    markdown = markdown.replace(/\n{3,}/g, "\n\n").trim();

    return markdown;
}
