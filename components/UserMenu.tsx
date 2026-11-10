"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/repo";
import { api } from "./api";

export default function UserMenu({ user }: { user: User }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await api("/api/session", { method: "DELETE" });
      router.push("/");
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        aria-hidden="true"
        className="grid h-8 w-8 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-800"
      >
        {initials}
      </span>
      <span className="hidden text-stone-700 sm:inline">
        <strong>{user.name}</strong>
      </span>
      <button
        onClick={logout}
        disabled={busy}
        className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-stone-700 hover:bg-stone-50 disabled:opacity-60"
      >
        {busy ? "Switching…" : "Switch profile"}
      </button>
    </div>
  );
}
