"use client";

import { useRouter } from "next/navigation";
import type { User } from "@/lib/repo";
import { api } from "./api";

export default function UserMenu({ user }: { user: User }) {
  const router = useRouter();
  async function logout() {
    await api("/api/session", { method: "DELETE" }).catch(() => undefined);
    router.push("/");
    router.refresh();
  }
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-slate-600">
        Signed in as <strong>{user.name}</strong>
      </span>
      <button onClick={logout} className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-50">
        Switch user
      </button>
    </div>
  );
}
