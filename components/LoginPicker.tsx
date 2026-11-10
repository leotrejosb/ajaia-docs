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
          className="group flex w-full items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-teal-500 hover:shadow-md disabled:translate-y-0 disabled:opacity-60"
        >
          <span
            aria-hidden="true"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal-50 font-semibold text-teal-800"
          >
            {u.name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">{u.name}</span>
            <span className="block truncate text-sm text-stone-500">{u.email}</span>
          </span>
          <span className="text-sm font-medium text-teal-700">
            {busy === u.id ? "Opening…" : "Explore →"}
          </span>
        </button>
      ))}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
