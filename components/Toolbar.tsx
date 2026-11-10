"use client";

import { useEditorState, type Editor } from "@tiptap/react";

function Btn({
  onClick,
  active,
  label,
  title,
  className = "",
}: {
  onClick: () => void;
  active?: boolean;
  label: React.ReactNode;
  title: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()} // keep editor selection
      onClick={onClick}
      className={`h-8 min-w-8 rounded px-2 text-sm hover:bg-slate-200 ${active ? "bg-slate-200 text-blue-700" : ""} ${className}`}
    >
      {label}
    </button>
  );
}

const Sep = () => <span className="mx-1 h-5 w-px bg-slate-300" />;

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
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-white px-2 py-1">
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
      <Btn title="Undo (Ctrl+Z)" label="↶" onClick={() => chain().undo().run()} className={s.canUndo ? "" : "opacity-40"} />
      <Btn title="Redo (Ctrl+Shift+Z)" label="↷" onClick={() => chain().redo().run()} className={s.canRedo ? "" : "opacity-40"} />
    </div>
  );
}
