"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import type { Doc, Share, User } from "@/lib/repo";
import { can } from "@/lib/access";
import { api } from "./api";
import Toolbar from "./Toolbar";
import ShareDialog from "./ShareDialog";
import UserMenu from "./UserMenu";

type SaveState = "saved" | "dirty" | "saving" | "error";
const AUTOSAVE_MS = 800;

export default function DocumentEditor({
  user,
  doc,
  initialShares,
}: {
  user: User;
  doc: Doc;
  initialShares: Share[];
}) {
  const editable = can.edit(doc.role);
  const [title, setTitle] = useState(doc.title);
  const [savedTitle, setSavedTitle] = useState(doc.title);
  const [state, setState] = useState<SaveState>("saved");
  const [error, setError] = useState<string | null>(null);
  const [shares, setShares] = useState(initialShares);
  const [shareOpen, setShareOpen] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Saves are chained so an older request can never overwrite a newer one.
  const chain = useRef<Promise<unknown>>(Promise.resolve());

  const save = useCallback(
    (patch: { title?: string; content?: string }) => {
      const run = async () => {
        setState("saving");
        try {
          await api(`/api/documents/${doc.id}`, { method: "PATCH", json: patch });
          setState((s) => (s === "saving" ? "saved" : s));
          setError(null);
          return true;
        } catch (e) {
          setState("error");
          setError((e as Error).message);
          return false;
        }
      };
      const p = chain.current.then(run);
      chain.current = p;
      return p;
    },
    [doc.id],
  );

  const editor = useEditor({
    immediatelyRender: false, // avoid SSR hydration mismatch
    editable,
    content: doc.content,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: !editable } }),
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    editorProps: { attributes: { class: "doc-content", "aria-label": "Document content" } },
    onUpdate: ({ editor: e }) => {
      setState("dirty");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => save({ content: e.getHTML() }), AUTOSAVE_MS);
    },
  });

  // Flush pending edits when leaving the page; warn if a save is still in flight.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state === "dirty" || state === "saving") e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [state]);

  useEffect(() => {
    return () => {
      if (timer.current && editor && !editor.isDestroyed) {
        clearTimeout(timer.current);
        void save({ content: editor.getHTML() });
      }
    };
  }, [editor, save]);

  async function commitTitle() {
    const next = title.trim();
    if (!next) {
      setTitle(savedTitle);
      setError("Title can't be empty");
      return;
    }
    if (next === savedTitle) return;
    if (await save({ title: next })) setSavedTitle(next);
  }

  const status = {
    saved: "All changes saved",
    dirty: "Unsaved changes…",
    saving: "Saving…",
    error: "Save failed",
  }[state];

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/documents" className="text-sm text-slate-500 hover:text-slate-900" aria-label="Back">
            ← Docs
          </Link>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            readOnly={!editable}
            maxLength={200}
            aria-label="Document title"
            className="min-w-0 flex-1 rounded px-2 py-1 text-lg font-semibold outline-none read-only:cursor-default focus:bg-slate-100"
          />
          <span
            className={`text-sm ${state === "error" ? "text-red-600" : "text-slate-500"}`}
            aria-live="polite"
          >
            {editable ? status : "View only"}
          </span>
          {can.share(doc.role) && (
            <button
              onClick={() => setShareOpen(true)}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Share{shares.length ? ` (${shares.length})` : ""}
            </button>
          )}
          <UserMenu user={user} />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {doc.role !== "owner" && (
          <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Shared with you by <strong>{doc.ownerName}</strong> ·{" "}
            {editable ? "you can edit" : "you have view-only access"}
          </p>
        )}
        {error && (
          <p role="alert" className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {editor && editable && <Toolbar editor={editor} />}
          <div className="px-8 py-6 sm:px-12">
            <EditorContent editor={editor} />
          </div>
        </div>
      </main>

      {shareOpen && (
        <ShareDialog
          docId={doc.id}
          ownerId={doc.ownerId}
          shares={shares}
          onChange={setShares}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
