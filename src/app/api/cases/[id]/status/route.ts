import { finish, readPayload, rejectOrigin } from "@/lib/api";
import { ensureUser } from "@/lib/auth/session";
import { recordCaseStatus } from "@/lib/cases/cases";
import { getDb } from "@/lib/db/client";
import { logFailure } from "@/lib/observability";
import { LIMITS, consumeRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

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
      return finish(request, 429, { ok: false, error: { code: "rate", message: "Too many updates." }, redirectTo: fallback }, fallback);
    }
    const updated = recordCaseStatus(db, identity.user.id, id, payload.action ?? "", {
      confirm: payload.confirm ?? "",
      amount: payload.amount ?? "",
    });
    if (!updated.ok) {
      return finish(request, updated.code === "not_found" ? 404 : 400, { ok: false, error: { code: updated.code, message: updated.message }, redirectTo: fallback }, fallback);
    }
    return finish(request, 200, { ok: true, notice: updated.notice, redirectTo: fallback }, fallback);
  } catch (error) {
    logFailure({ scope: "cases", code: "unexpected", detail: error instanceof Error ? error.name : "error" });
    return finish(request, 500, { ok: false, error: { code: "generic", message: "Rewind could not record that outcome." } }, fallback);
  }
}
