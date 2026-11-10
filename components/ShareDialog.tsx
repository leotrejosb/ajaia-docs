"use client";

import { useEffect, useState } from "react";
import type { Share, User } from "@/lib/repo";
import { api } from "./api";

export default function ShareDialog({
  docId,
  ownerId,
  shares,
  onChange,
  onClose,
}: {
  docId: string;
  ownerId: string;
  shares: Share[];
  onChange: (s: Share[]) => void;
  onClose: () => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("editor");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ users: User[] }>("/api/users")
      .then((r) => setUsers(r.users))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const candidates = users.filter((u) => u.id !== ownerId && !shares.some((s) => s.userId === u.id));

  async function run(p: Promise<{ shares: Share[] }>) {
    setBusy(true);
    setError(null);
    try {
      onChange((await p).shares);
      setEmail("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const share = (targetEmail: string, r: "viewer" | "editor") =>
    run(api(`/api/documents/${docId}/shares`, { method: "POST", json: { email: targetEmail, role: r } }));
  const revoke = (userId: string) =>
    run(api(`/api/documents/${docId}/shares`, { method: "DELETE", json: { userId } }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="share-title" className="text-lg font-semibold">
            Share document
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">
            ✕
          </button>
        </div>

        <form
          className="mt-4 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) share(email, role);
          }}
        >
          <input
            list="share-candidates"
            type="email"
            placeholder="Email, e.g. bob@ajaia.test"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2"
            required
          />
          <datalist id="share-candidates">
            {candidates.map((u) => (
              <option key={u.id} value={u.email}>
                {u.name}
              </option>
            ))}
          </datalist>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "viewer" | "editor")}
            className="rounded-md border border-slate-300 px-2 py-2"
          >
            <option value="editor">Can edit</option>
            <option value="viewer">Can view</option>
          </select>
          <button
            disabled={busy}
            className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Share
          </button>
        </form>
        {candidates.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            Demo users: {candidates.map((u) => u.email).join(", ")}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <h3 className="mt-6 text-sm font-semibold text-slate-600">People with access</h3>
        <ul className="mt-2 divide-y divide-slate-100">
          {shares.length === 0 && <li className="py-2 text-sm text-slate-500">Only you.</li>}
          {shares.map((s) => (
            <li key={s.userId} className="flex items-center justify-between gap-2 py-2">
              <span className="min-w-0">
                <span className="block truncate font-medium">{s.name}</span>
                <span className="block truncate text-sm text-slate-500">{s.email}</span>
              </span>
              <span className="flex items-center gap-2">
                <select
                  value={s.role}
                  disabled={busy}
                  onChange={(e) => share(s.email, e.target.value as "viewer" | "editor")}
                  className="rounded border border-slate-300 px-1 py-1 text-sm"
                >
                  <option value="editor">Can edit</option>
                  <option value="viewer">Can view</option>
                </select>
                <button
                  disabled={busy}
                  onClick={() => revoke(s.userId)}
                  className="text-sm text-slate-400 hover:text-red-600"
                >
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
