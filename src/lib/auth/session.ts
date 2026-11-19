import { cookies } from "next/headers";
import { createGuest, readUserByToken, type PublicUser } from "@/lib/auth/users";
import type { RewindDb } from "@/lib/db/client";
import { requestIsSecure } from "@/lib/http";

export const SESSION_COOKIE = "rewind_session";
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export async function readSessionUser(db: RewindDb): Promise<PublicUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readUserByToken(db, token);
}

export async function writeSessionCookie(token: string, request: Request) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS_SECONDS,
    secure: requestIsSecure(request),
  });
}

export async function clearSessionCookie(request: Request) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: requestIsSecure(request),
  });
}

export async function ensureUser(db: RewindDb, request: Request) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const existing = readUserByToken(db, token);
    if (existing) return { ok: true as const, user: existing, created: false };
  }
  const created = createGuest(db);
  if (!created.ok) return created;
  await writeSessionCookie(created.token, request);
  return { ok: true as const, user: created.user, created: true };
}
