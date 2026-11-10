import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { listDocuments } from "@/lib/repo";
import { getCurrentUser } from "@/lib/session";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const docs = await listDocuments(await getDb(), user.id);
  return <Dashboard user={user} owned={docs.owned} shared={docs.shared} />;
}
