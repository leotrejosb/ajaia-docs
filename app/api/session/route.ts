import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUser } from "@/lib/repo";
import { handle } from "@/lib/http";
import { loginSchema } from "@/lib/validation";
import { clearSession, setSession } from "@/lib/session";
import { badRequest } from "@/lib/errors";

export const POST = handle(async (req: Request) => {
  const { userId } = loginSchema.parse(await req.json());
  const user = await getUser(await getDb(), userId);
  if (!user) throw badRequest("Unknown user");
  await setSession(user.id);
  return NextResponse.json({ user });
});

export const DELETE = handle(async () => {
  await clearSession();
  return NextResponse.json({ ok: true });
});
