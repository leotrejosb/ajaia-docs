import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createDocument } from "@/lib/repo";
import { handle } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { fileToDocument, MAX_UPLOAD_BYTES } from "@/lib/import";
import { badRequest } from "@/lib/errors";

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw badRequest("Attach a file in the 'file' field");
  if (file.size > MAX_UPLOAD_BYTES) throw badRequest("File is larger than 2 MB");

  const { title, html } = await fileToDocument(file.name, Buffer.from(await file.arrayBuffer()));
  const id = await createDocument(await getDb(), user.id, title, html);
  return NextResponse.json({ id }, { status: 201 });
});
