import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { recordEvent } from "@/lib/audit";
import type { RewindDb } from "@/lib/db/client";
import { sessions, users } from "@/lib/db/schema";
import { DEFAULT_TIMEZONE, isTimeZone, nowIso } from "@/lib/time";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export type PublicUser = {
  id: string;
  displayName: string;
  kind: string;
  timezone: string;
};

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function sessionExpiry(from = new Date()) {
  return new Date(from.getTime() + THIRTY_DAYS_MS).toISOString();
}

export function toPublicUser(row: typeof users.$inferSelect): PublicUser {
  return {
    id: row.id,
    displayName: row.displayName,
    kind: row.kind,
    timezone: isTimeZone(row.timezone) ? row.timezone : DEFAULT_TIMEZONE,
  };
}

function issueSession(db: RewindDb, userId: string) {
  const token = randomBytes(32).toString("base64url");
  const createdAt = nowIso();
  db.insert(sessions)
    .values({
      id: randomUUID(),
      userId,
      tokenHash: hashToken(token),
      createdAt,
      expiresAt: sessionExpiry(),
    })
    .run();
  return token;
}

export function createGuest(db: RewindDb) {
  const id = randomUUID();
  const createdAt = nowIso();
  db.insert(users)
    .values({
      id,
      displayName: "",
      kind: "guest",
      timezone: DEFAULT_TIMEZONE,
      createdAt,
    })
    .run();
  const token = issueSession(db, id);
  recordEvent(db, id, "guest_created", {});
  const row = db.select().from(users).where(eq(users.id, id)).get();
  if (!row) return { ok: false as const, message: "Rewind could not start a session." };
  return { ok: true as const, user: toPublicUser(row), token };
}

export function readUserByToken(db: RewindDb, token: string) {
  const row = db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, nowIso())))
    .get();
  if (!row || row.user.kind === "deleted" || row.user.kind === "demo") return null;
  return toPublicUser(row.user);
}

const namePattern = /^[\p{L}\p{M}][\p{L}\p{M} .'-]{0,38}[\p{L}\p{M}.]$/u;

export function updateProfile(db: RewindDb, userId: string, input: { displayName: string; timezone: string }) {
  const existing = db.select().from(users).where(eq(users.id, userId)).get();
  if (!existing || existing.kind === "deleted") {
    return { ok: false as const, code: "forbidden" as const, message: "That session is not on this server." };
  }
  const trimmed = input.displayName.trim().replace(/\s+/g, " ");
  if (trimmed.length > 0) {
    if (trimmed.includes("@")) {
      return { ok: false as const, code: "name" as const, message: "Use a first name, not an email address." };
    }
    if (trimmed.length < 2 || trimmed.length > 40 || !namePattern.test(trimmed)) {
      return {
        ok: false as const,
        code: "name" as const,
        message: "Use 2 to 40 letters. You can include spaces, hyphens, and apostrophes.",
      };
    }
  }
  if (!isTimeZone(input.timezone)) {
    return { ok: false as const, code: "timezone" as const, message: "Choose a timezone Rewind recognizes, such as America/New_York." };
  }
  db.update(users)
    .set({ displayName: trimmed, timezone: input.timezone.trim() })
    .where(eq(users.id, userId))
    .run();
  recordEvent(db, userId, "profile_saved", { timezone: input.timezone.trim() });
  const row = db.select().from(users).where(eq(users.id, userId)).get();
  if (!row) return { ok: false as const, code: "generic" as const, message: "Rewind could not store those settings." };
  return { ok: true as const, user: toPublicUser(row) };
}
