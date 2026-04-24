"use client";

import { useEffect } from "react";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import clsx from "clsx";

const extensions = [
  StarterKit.configure({
    heading: false,
    codeBlock: false,
    code: false,
    blockquote: false,
    horizontalRule: false,
    strike: false,
    link: false,
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    protocols: ["http", "https", "mailto"],
    HTMLAttributes: {
      rel: "noopener noreferrer",
      target: "_blank",
      class: "font-semibold text-[#0b6b63] underline underline-offset-2",
    },
  }),
];

type Props = {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  editorMinHeightClassName?: string;
};

export function SimpleRichTextEditor({
  value,
  onChange,
  className,
  editorMinHeightClassName,
}: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions,
    content: value?.trim() ? value : "<p></p>",
    editorProps: {
      attributes: {
        class: [
          "prose-rich px-3 py-2.5 text-sm text-neutral-900 outline-none",
          editorMinHeightClassName || "min-h-[88px]",
        ].join(" "),
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const next = value?.trim() ? value : "<p></p>";
    const cur = editor.getHTML();
    if (next !== cur) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div
      className={clsx(
        "rounded-xl border-2 border-neutral-300 bg-white shadow-sm transition-[box-shadow,border-color]",
        "focus-within:border-[#0b6b63] focus-within:ring-2 focus-within:ring-[#0b6b63]/20",
        className
      )}
    >
      {editor ? (
        <div className="flex flex-wrap gap-0.5 border-b border-neutral-200 bg-neutral-50/90 px-2 py-1.5">
          <ToolbarBtn
            label="Gras"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
          <ToolbarBtn
            label="Italique"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />
          <ToolbarBtn
            label="Liste"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolbarBtn
            label="1. 2. 3."
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
          <ToolbarBtn
            label="Lien"
            active={editor.isActive("link")}
            onClick={() => {
              const prev = editor.getAttributes("link").href as string | undefined;
              const url = window.prompt(
                "Adresse du lien (https://…)",
                prev && String(prev).trim() ? String(prev) : "https://"
              );
              if (url === null) return;
              const u = url.trim();
              if (u === "") {
                editor.chain().focus().extendMarkRange("link").unsetLink().run();
                return;
              }
              editor.chain().focus().extendMarkRange("link").setLink({ href: u }).run();
            }}
          />
        </div>
      ) : (
        <div className="h-9 border-b border-neutral-200 bg-neutral-50/90" aria-hidden />
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-lg px-2 py-1 text-[11px] font-bold transition-colors",
        active
          ? "bg-[#0b6b63] text-white"
          : "bg-white text-neutral-800 ring-1 ring-neutral-200 hover:bg-neutral-100"
      )}
    >
      {label}
    </button>
  );
}
