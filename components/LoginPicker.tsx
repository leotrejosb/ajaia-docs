"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/repo";
import { api } from "./api";

export default function LoginPicker({ users }: { users: User[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function login(userId: string) {
    setBusy(userId);
    setError(null);
    try {
      await api("/api/session", { method: "POST", json: { userId } });
      router.push("/documents");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  return (
    <div className="mt-8 space-y-3">
      {users.map((u) => (
        <button
          key={u.id}
          onClick={() => login(u.id)}
          disabled={busy !== null}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-blue-400 disabled:opacity-60"
        >
          <span>
            <span className="block font-medium">{u.name}</span>
            <span className="block text-sm text-slate-500">{u.email}</span>
          </span>
          <span className="text-sm text-blue-600">{busy === u.id ? "Signing in…" : "Sign in →"}</span>
        </button>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
