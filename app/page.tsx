import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { listUsers } from "@/lib/repo";
import { getCurrentUser } from "@/lib/session";
import LoginPicker from "@/components/LoginPicker";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (await getCurrentUser()) redirect("/documents");
  const users = await listUsers(await getDb());
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="text-3xl font-bold">Ajaia Docs</h1>
      <p className="mt-2 text-slate-600">
        Pick a demo account to sign in. Sign in as a different user in another browser (or after signing
        out) to see shared documents from the other side.
      </p>
      <LoginPicker users={users} />
    </main>
  );
}
