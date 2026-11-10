import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createDocument, listDocuments } from "@/lib/repo";
import { handle } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { createDocSchema } from "@/lib/validation";

export const GET = handle(async () => {
  const user = await requireUser();
  return NextResponse.json(await listDocuments(await getDb(), user.id));
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = await req.json();
  const { title } = createDocSchema.parse(body);
  const id = await createDocument(await getDb(), user.id, title ?? "Untitled document");
  return NextResponse.json({ id }, { status: 201 });
});
