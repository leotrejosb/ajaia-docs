"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DocSummary, User } from "@/lib/repo";
import { api } from "./api";
import UserMenu from "./UserMenu";

const ACCEPT = ".txt,.md,.markdown,.docx";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function Dashboard({
  user,
  owned,
  shared,
}: {
  user: User;
  owned: DocSummary[];
  shared: DocSummary[];
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"create" | "import" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createDoc() {
    setBusy("create");
    setError(null);
    try {
      const { id } = await api<{ id: string }>("/api/documents", { method: "POST", json: {} });
      router.push(`/documents/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  async function importFile(file: File) {
    setBusy("import");
    setError(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const { id } = await api<{ id: string }>("/api/documents/import", { method: "POST", body: form });
      router.push(`/documents/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function remove(doc: DocSummary) {
    if (!confirm(`Delete “${doc.title}”? You won’t be able to recover it.`)) return;
    try {
      await api(`/api/documents/${doc.id}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/documents" className="font-bold tracking-tight text-stone-950">
            <span className="text-teal-700">Ajaia</span> Docs
          </Link>
          <UserMenu user={user} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm text-stone-500">Good to see you, {user.name.split(" ")[0]}.</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Your workspace</h1>
            <p className="mt-2 text-stone-600">Pick up where you left off or start with a blank page.</p>
          </div>
          <div className="flex flex-wrap gap-3">
          <button
            onClick={createDoc}
            disabled={busy !== null}
            className="rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-teal-800 disabled:opacity-60"
          >
            {busy === "create" ? "Creating…" : "+ New document"}
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            disabled={busy !== null}
            className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 font-medium hover:border-stone-400 hover:bg-stone-50 disabled:opacity-60"
          >
            {busy === "import" ? "Importing…" : "Import a file"}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])}
          />
          </div>
        </div>
        <p className="mt-3 text-right text-xs text-stone-500">Imports .txt, .md and .docx files up to 2 MB</p>
        {error && (
          <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <Section
          title="My documents"
          count={owned.length}
          empty="No documents yet. Create a blank page or import something you already have."
        >
          {owned.map((d) => (
            <Row key={d.id} doc={d} meta={`Updated ${formatDate(d.updatedAt)}`} onDelete={() => remove(d)} />
          ))}
        </Section>

        <Section
          title="Shared with me"
          count={shared.length}
          empty="Documents shared by your teammates will show up here."
        >
          {shared.map((d) => (
            <Row key={d.id} doc={d} meta={`${d.ownerName} · Updated ${formatDate(d.updatedAt)}`} />
          ))}
        </Section>
      </main>
    </div>
  );
}

function Section({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <section className="mt-10">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-stone-500">{count}</span>
      </div>
      {children.length ? (
        <ul className="mt-3 divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          {children}
        </ul>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-stone-300 bg-white/60 px-5 py-8 text-center text-stone-500">
          {empty}
        </p>
      )}
    </section>
  );
}

function RoleBadge({ role }: { role: DocSummary["role"] }) {
  const styles = {
    owner: "bg-stone-100 text-stone-700",
    editor: "bg-teal-50 text-teal-800",
    viewer: "bg-amber-50 text-amber-800",
  }[role];
  const label = { owner: "Owner", editor: "Can edit", viewer: "View only" }[role];
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}>{label}</span>;
}

function Row({ doc, meta, onDelete }: { doc: DocSummary; meta: string; onDelete?: () => void }) {
  return (
    <li className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-amber-50/40">
      <Link href={`/documents/${doc.id}`} className="min-w-0 flex-1 rounded">
        <span className="block truncate font-medium">{doc.title}</span>
        <span className="mt-0.5 block text-sm text-stone-500">{meta}</span>
      </Link>
      <RoleBadge role={doc.role} />
      {onDelete && (
        <button
          onClick={onDelete}
          className="rounded px-1 text-sm text-stone-400 hover:text-red-700"
          aria-label={`Delete ${doc.title}`}
        >
          Delete
        </button>
      )}
    </li>
  );
}
