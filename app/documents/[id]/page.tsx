import { notFound, redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getDocumentForUser, listShares } from "@/lib/repo";
import { getCurrentUser } from "@/lib/session";
import DocumentEditor from "@/components/DocumentEditor";

export const dynamic = "force-dynamic";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const db = await getDb();
  const doc = await getDocumentForUser(db, (await params).id, user.id);
  if (!doc) notFound();
  const shares = await listShares(db, doc.id, user.id);
  return <DocumentEditor user={user} doc={doc} initialShares={shares} />;
}
