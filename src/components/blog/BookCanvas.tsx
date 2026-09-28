"use client";

import CharacterCount from "@tiptap/extension-character-count";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

import { toBookHtml } from "~/lib/blog/html";
import { UploadButton } from "~/utils/uploadthing";

import { FloatImage } from "./float-image";

type BookCanvasProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean;
};

export function BookCanvas({
  value,
  onChange,
  placeholder = "Paste a draft…",
  disabled,
  compact,
}: BookCanvasProps) {
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Typography,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      CharacterCount.configure({ limit: 50000 }),
      FloatImage.configure({
        inline: false,
        allowBase64: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: toBookHtml(value) || "<p></p>",
    editorProps: {
      attributes: {
        class: `book-prose book-canvas-page outline-none ${compact ? "is-compact" : ""}`,
      },
    },
    onUpdate: ({ editor: next }) => {
      onChange(next.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  const insertPicture = (src: string, float: "left" | "right") => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent(
        `<img src="${src.replaceAll('"', "")}" alt="" data-float="${float}" class="book-pic book-pic-${float}" />`,
      )
      .run();
  };

  const setLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const next = window.prompt("Link", previous ?? "https://");
    if (next === null) return;
    if (!next.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: next.trim() }).run();
  };

  const words = editor?.storage.characterCount?.words() ?? 0;

  return (
    <div className={`book-canvas space-y-3 ${compact ? "is-compact" : ""}`}>
      <div className="book-quill flex flex-wrap items-center gap-1.5">
        <button type="button" className="book-mark" disabled={!editor} onClick={() => editor?.chain().focus().toggleBold().run()}>
          B
        </button>
        <button type="button" className="book-mark italic" disabled={!editor} onClick={() => editor?.chain().focus().toggleItalic().run()}>
          I
        </button>
        <button type="button" className="book-mark underline" disabled={!editor} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
          U
        </button>
        <button type="button" className="book-mark" disabled={!editor} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
          H
        </button>
        <button type="button" className="book-mark" disabled={!editor} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
          “
        </button>
        <button type="button" className="book-mark" disabled={!editor} onClick={setLink}>
          Link
        </button>
        <span className="book-quill-rule" />
        <UploadButton
          endpoint="imageUploader"
          content={{ button: compact ? "Picture" : "Picture left" }}
          onClientUploadComplete={(res) => {
            const file = res?.[0] as { url?: string; ufsUrl?: string } | undefined;
            const url = file?.ufsUrl ?? file?.url;
            if (url) insertPicture(url, "left");
          }}
          appearance={{
            button: "book-mark book-mark-wide ut-ready:bg-transparent",
            allowedContent: "hidden",
          }}
        />
        {compact ? null : (
          <UploadButton
            endpoint="imageUploader"
            content={{ button: "Picture right" }}
            onClientUploadComplete={(res) => {
              const file = res?.[0] as { url?: string; ufsUrl?: string } | undefined;
              const url = file?.ufsUrl ?? file?.url;
              if (url) insertPicture(url, "right");
            }}
            appearance={{
              button: "book-mark book-mark-wide ut-ready:bg-transparent",
              allowedContent: "hidden",
            }}
          />
        )}
        <span className="ml-auto text-[11px] text-os-muted">{words} words</span>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
