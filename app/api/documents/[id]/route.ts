import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { deleteDocument, getDocumentForUser, updateDocument } from "@/lib/repo";
import { handle } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { updateDocSchema } from "@/lib/validation";
import { notFound } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const doc = await getDocumentForUser(await getDb(), (await params).id, user.id);
  if (!doc) throw notFound();
  return NextResponse.json({ document: doc });
});

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const patch = updateDocSchema.parse(await req.json());
  const result = await updateDocument(await getDb(), (await params).id, user.id, patch);
  return NextResponse.json(result);
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  await deleteDocument(await getDb(), (await params).id, user.id);
  return NextResponse.json({ ok: true });
});
