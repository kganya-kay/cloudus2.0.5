"use client";

import Placeholder from "@tiptap/extension-placeholder";
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
};

export function BookCanvas({
  value,
  onChange,
  placeholder = "Begin…",
  disabled,
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
      FloatImage.configure({
        inline: false,
        allowBase64: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: toBookHtml(value) || "<p></p>",
    editorProps: {
      attributes: {
        class: "book-prose book-canvas-page outline-none",
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
    editor.chain().focus().insertContent(
      `<img src="${src.replaceAll('"', "")}" alt="" data-float="${float}" class="book-pic book-pic-${float}" />`,
    ).run();
  };

  return (
    <div className="book-canvas space-y-3">
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
        <span className="book-quill-rule" />
        <UploadButton
          endpoint="imageUploader"
          content={{ button: "Picture left" }}
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
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
