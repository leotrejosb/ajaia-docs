import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { listShares, revokeShare, shareDocument } from "@/lib/repo";
import { handle } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { revokeSchema, shareSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  return NextResponse.json({ shares: await listShares(await getDb(), (await params).id, user.id) });
});

export const POST = handle(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { email, role } = shareSchema.parse(await req.json());
  const shares = await shareDocument(await getDb(), (await params).id, user.id, email, role);
  return NextResponse.json({ shares });
});

export const DELETE = handle(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { userId } = revokeSchema.parse(await req.json());
  const shares = await revokeShare(await getDb(), (await params).id, user.id, userId);
  return NextResponse.json({ shares });
});
