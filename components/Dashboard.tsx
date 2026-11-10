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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createDoc() {
    setBusy(true);
    setError(null);
    try {
      const { id } = await api<{ id: string }>("/api/documents", { method: "POST", json: {} });
      router.push(`/documents/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function importFile(file: File) {
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const { id } = await api<{ id: string }>("/api/documents/import", { method: "POST", body: form });
      router.push(`/documents/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function remove(doc: DocSummary) {
    if (!confirm(`Delete "${doc.title}"? This can't be undone.`)) return;
    try {
      await api(`/api/documents/${doc.id}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold">Ajaia Docs</span>
          <UserMenu user={user} />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={createDoc}
            disabled={busy}
            className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            + New document
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            disabled={busy}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 font-medium hover:bg-slate-50 disabled:opacity-60"
          >
            Import file
          </button>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])}
          />
          <span className="text-sm text-slate-500">Import supports .txt, .md and .docx (max 2 MB)</span>
        </div>
        {error && (
          <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <Section title="My documents" empty="You haven't created any documents yet.">
          {owned.map((d) => (
            <Row key={d.id} doc={d} meta={`Edited ${formatDate(d.updatedAt)}`} onDelete={() => remove(d)} />
          ))}
        </Section>

        <Section title="Shared with me" empty="Nothing has been shared with you yet.">
          {shared.map((d) => (
            <Row key={d.id} doc={d} meta={`Owner: ${d.ownerName} · Edited ${formatDate(d.updatedAt)}`} />
          ))}
        </Section>
      </main>
    </div>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children.length ? (
        <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">{children}</ul>
      ) : (
        <p className="mt-3 text-slate-500">{empty}</p>
      )}
    </section>
  );
}

function RoleBadge({ role }: { role: DocSummary["role"] }) {
  const styles = {
    owner: "bg-slate-100 text-slate-700",
    editor: "bg-green-100 text-green-800",
    viewer: "bg-amber-100 text-amber-800",
  }[role];
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${styles}`}>{role}</span>;
}

function Row({ doc, meta, onDelete }: { doc: DocSummary; meta: string; onDelete?: () => void }) {
  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50">
      <Link href={`/documents/${doc.id}`} className="min-w-0 flex-1">
        <span className="block truncate font-medium">{doc.title}</span>
        <span className="block text-sm text-slate-500">{meta}</span>
      </Link>
      <RoleBadge role={doc.role} />
      {onDelete && (
        <button onClick={onDelete} className="text-sm text-slate-400 hover:text-red-600" aria-label="Delete">
          Delete
        </button>
      )}
    </li>
  );
}
