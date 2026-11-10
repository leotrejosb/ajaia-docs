import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { listUsers } from "@/lib/repo";
import { handle } from "@/lib/http";
import { requireUser } from "@/lib/session";

export const GET = handle(async () => {
  await requireUser();
  return NextResponse.json({ users: await listUsers(await getDb()) });
});
