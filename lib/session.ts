import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";
import { getUser, type User } from "./repo";
import { unauthorized } from "./errors";

/**
 * Mocked auth: the user picks a seeded account and we store a signed user id in an httpOnly cookie.
 * The HMAC stops a reviewer from editing the cookie to impersonate another user.
 */
const COOKIE = "session";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production");
  }
  return "dev-only-insecure-secret";
}

export function sign(userId: string) {
  const mac = createHmac("sha256", secret()).update(userId).digest("base64url");
  return `${userId}.${mac}`;
}

export function verify(token: string | undefined): string | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i < 1) return null;
  const userId = token.slice(0, i);
  const expected = Buffer.from(sign(userId));
  const actual = Buffer.from(token);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return userId;
}

export async function setSession(userId: string) {
  (await cookies()).set(COOKIE, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const userId = verify((await cookies()).get(COOKIE)?.value);
  if (!userId) return null;
  return getUser(await getDb(), userId);
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw unauthorized();
  return user;
}
