"use client";

import { useEditorState, type Editor } from "@tiptap/react";

function Btn({
  onClick,
  active,
  label,
  title,
  disabled = false,
  className = "",
}: {
  onClick: () => void;
  active?: boolean;
  label: React.ReactNode;
  title: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // keep editor selection
      onClick={onClick}
      className={`h-8 min-w-8 rounded px-2 text-sm hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-35 ${active ? "bg-teal-100 text-teal-800" : ""} ${className}`}
    >
      {label}
    </button>
  );
}

const Sep = () => <span aria-hidden="true" className="mx-1 h-5 w-px bg-stone-300" />;

export default function Toolbar({ editor }: { editor: Editor }) {
  // Re-render only when the active formatting changes.
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const chain = () => editor.chain().focus();

  return (
    <div
      role="toolbar"
      aria-label="Document formatting"
      className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-stone-200 bg-stone-50/95 px-2 py-1.5"
    >
      <Btn title="Bold (Ctrl+B)" label={<b>B</b>} active={s.bold} onClick={() => chain().toggleBold().run()} />
      <Btn title="Italic (Ctrl+I)" label={<i>I</i>} active={s.italic} onClick={() => chain().toggleItalic().run()} />
      <Btn
        title="Underline (Ctrl+U)"
        label={<u>U</u>}
        active={s.underline}
        onClick={() => chain().toggleUnderline().run()}
      />
      <Sep />
      <Btn title="Normal text" label="Text" onClick={() => chain().setParagraph().run()} />
      <Btn title="Heading 1" label="H1" active={s.h1} onClick={() => chain().toggleHeading({ level: 1 }).run()} />
      <Btn title="Heading 2" label="H2" active={s.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()} />
      <Btn title="Heading 3" label="H3" active={s.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()} />
      <Sep />
      <Btn title="Bulleted list" label="• List" active={s.bullet} onClick={() => chain().toggleBulletList().run()} />
      <Btn
        title="Numbered list"
        label="1. List"
        active={s.ordered}
        onClick={() => chain().toggleOrderedList().run()}
      />
      <Sep />
      <Btn title="Undo (Ctrl+Z)" label="↶" disabled={!s.canUndo} onClick={() => chain().undo().run()} />
      <Btn title="Redo (Ctrl+Shift+Z)" label="↷" disabled={!s.canRedo} onClick={() => chain().redo().run()} />
    </div>
  );
}
