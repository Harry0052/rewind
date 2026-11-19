import { finish, readPayload, rejectOrigin } from "@/lib/api";
import { ensureUser, readSessionUser } from "@/lib/auth/session";
import { getCase, saveCaseDraft } from "@/lib/cases/cases";
import { getDb } from "@/lib/db/client";
import { logFailure } from "@/lib/observability";
import { LIMITS, consumeRateLimit } from "@/lib/security/rate-limit";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const db = getDb();
  const user = await readSessionUser(db);
  const record = getCase(db, id, user?.id ?? null);
  if (!record) return NextResponse.json({ ok: false, error: { code: "not_found", message: "That case is not in this browser." } }, { status: 404 });
  return NextResponse.json(
    {
      ok: true,
      case: {
        id: record.caseRow.id,
        status: record.caseRow.status,
        subject: record.caseRow.subject,
        recordedSentAt: record.caseRow.recordedSentAt,
        resultAmountMinor: record.caseRow.resultAmountMinor,
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const fallback = `/cases/${id}`;
  const blocked = rejectOrigin(request, fallback);
  if (blocked) return blocked;
  try {
    const payload = await readPayload(request);
    const db = getDb();
    const identity = await ensureUser(db, request);
    if (!identity.ok) return finish(request, 500, { ok: false, error: { code: "generic", message: identity.message } }, fallback);
    if (!consumeRateLimit(db, `case:${identity.user.id}`, LIMITS.caseWrite.limit, LIMITS.caseWrite.windowMs)) {
      return finish(request, 429, { ok: false, error: { code: "rate", message: "Too many saves." }, redirectTo: fallback }, fallback);
    }
    const checked = ["receipt", "photo", "policy"].filter((item) => payload[`evidence_${item}`] === "yes");
    const saved = saveCaseDraft(db, identity.user.id, id, { subject: payload.subject ?? "", body: payload.body ?? "", checked });
    if (!saved.ok) {
      return finish(request, saved.code === "not_found" ? 404 : 400, { ok: false, error: { code: saved.code, message: saved.message }, redirectTo: fallback }, fallback);
    }
    return finish(request, 200, { ok: true, notice: "saved", redirectTo: fallback }, fallback);
  } catch (error) {
    logFailure({ scope: "cases", code: "unexpected", detail: error instanceof Error ? error.name : "error" });
    return finish(request, 500, { ok: false, error: { code: "generic", message: "Rewind could not save that letter." } }, fallback);
  }
}
