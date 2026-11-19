import { finish, rejectOrigin } from "@/lib/api";
import { ensureUser } from "@/lib/auth/session";
import { prepareCase } from "@/lib/cases/cases";
import { getDb } from "@/lib/db/client";
import { logFailure } from "@/lib/observability";
import { LIMITS, consumeRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const fallback = `/opportunities/${id}`;
  const blocked = rejectOrigin(request, fallback);
  if (blocked) return blocked;
  try {
    const db = getDb();
    const identity = await ensureUser(db, request);
    if (!identity.ok) return finish(request, 500, { ok: false, error: { code: "generic", message: identity.message } }, fallback);
    if (!consumeRateLimit(db, `case:${identity.user.id}`, LIMITS.caseWrite.limit, LIMITS.caseWrite.windowMs)) {
      return finish(request, 429, { ok: false, error: { code: "rate", message: "Too many cases." }, redirectTo: fallback }, fallback);
    }
    const prepared = prepareCase(db, identity.user.id, id, identity.user.displayName);
    if (!prepared.ok) {
      const status = prepared.code === "not_found" ? 404 : 400;
      return finish(request, status, { ok: false, error: { code: prepared.code, message: prepared.message }, redirectTo: fallback }, fallback);
    }
    return finish(request, 200, { ok: true, notice: "draft", redirectTo: `/cases/${prepared.id}` }, `/cases/${prepared.id}`);
  } catch (error) {
    logFailure({ scope: "cases", code: "unexpected", detail: error instanceof Error ? error.name : "error" });
    return finish(request, 500, { ok: false, error: { code: "generic", message: "Rewind could not prepare that request." } }, fallback);
  }
}
