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
    <main className="mx-auto grid min-h-screen max-w-5xl items-center gap-12 px-6 py-12 md:grid-cols-[1.1fr_0.9fr]">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Ajaia Docs</p>
        <h1 className="mt-4 max-w-xl text-4xl font-bold leading-tight tracking-tight text-stone-950 sm:text-5xl">
          Ideas are easier to shape when everyone has a place to write.
        </h1>
        <p className="mt-5 max-w-lg text-lg leading-8 text-stone-600">
          Draft notes, import an existing file, and invite the right people when you are ready for feedback.
        </p>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-600">
          <span>Automatic saving</span>
          <span aria-hidden="true">·</span>
          <span>Simple permissions</span>
          <span aria-hidden="true">·</span>
          <span>DOCX and Markdown import</span>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200/80 bg-white/90 p-6 shadow-xl shadow-stone-900/5 backdrop-blur">
        <h2 className="text-xl font-semibold">Open the demo workspace</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Choose a profile to see the same workspace from a different point of view. No password is needed.
        </p>
        <LoginPicker users={users} />
      </section>
    </main>
  );
}
