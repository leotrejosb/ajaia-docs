"use client";

import { useEffect, useRef, useState } from "react";
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
  const emailInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<{ users: User[] }>("/api/users")
      .then((r) => setUsers(r.users))
      .catch(() => setError("We couldn’t load the available demo profiles."));
  }, []);

  useEffect(() => {
    emailInput.current?.focus();
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
        aria-describedby="share-description"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="share-title" className="text-xl font-semibold">
              Invite someone
            </h2>
            <p id="share-description" className="mt-1 text-sm text-stone-600">
              Choose who can read this document and who can make changes.
            </p>
          </div>
          <button onClick={onClose} className="rounded text-stone-400 hover:text-stone-700" aria-label="Close dialog">
            ✕
          </button>
        </div>

        <form
          className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) share(email, role);
          }}
        >
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">Email address</span>
            <input
              ref={emailInput}
              list="share-candidates"
              type="email"
              placeholder="name@ajaia.test"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
              required
            />
          </label>
          <datalist id="share-candidates">
            {candidates.map((u) => (
              <option key={u.id} value={u.email}>
                {u.name}
              </option>
            ))}
          </datalist>
          <label>
            <span className="mb-1.5 block text-sm font-medium text-stone-700">Permission</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "viewer" | "editor")}
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
            >
              <option value="editor">Can edit</option>
              <option value="viewer">View only</option>
            </select>
          </label>
          <button
            disabled={busy}
            className="self-end rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {busy ? "Updating…" : "Send invite"}
          </button>
        </form>
        {candidates.length > 0 && (
          <p className="mt-2 text-xs leading-5 text-stone-500">
            Available in this demo: {candidates.map((u) => u.email).join(", ")}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <h3 className="mt-6 text-sm font-semibold text-stone-700">People with access</h3>
        <ul className="mt-2 divide-y divide-stone-100">
          {shares.length === 0 && (
            <li className="py-3 text-sm text-stone-500">Only you can open this document right now.</li>
          )}
          {shares.map((s) => (
            <li key={s.userId} className="flex items-center justify-between gap-2 py-2">
              <span className="min-w-0">
                <span className="block truncate font-medium">{s.name}</span>
                <span className="block truncate text-sm text-stone-500">{s.email}</span>
              </span>
              <span className="flex items-center gap-2">
                <select
                  value={s.role}
                  disabled={busy}
                  aria-label={`Permission for ${s.name}`}
                  onChange={(e) => share(s.email, e.target.value as "viewer" | "editor")}
                  className="rounded border border-stone-300 px-1 py-1 text-sm"
                >
                  <option value="editor">Can edit</option>
                  <option value="viewer">View only</option>
                </select>
                <button
                  disabled={busy}
                  onClick={() => revoke(s.userId)}
                  className="rounded text-sm text-stone-400 hover:text-red-700"
                  aria-label={`Remove ${s.name} from this document`}
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
