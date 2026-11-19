import { finish, rejectOrigin } from "@/lib/api";
import { ensureUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { logFailure } from "@/lib/observability";
import { deletePurchase } from "@/lib/purchases/purchases";
import { LIMITS, consumeRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const blocked = rejectOrigin(request, `/purchases/${id}`);
  if (blocked) return blocked;
  try {
    const db = getDb();
    const identity = await ensureUser(db, request);
    if (!identity.ok) {
      return finish(request, 500, { ok: false, error: { code: "generic", message: identity.message } }, "/purchases");
    }
    if (!consumeRateLimit(db, `purchase:${identity.user.id}`, LIMITS.purchase.limit, LIMITS.purchase.windowMs)) {
      return finish(request, 429, { ok: false, error: { code: "rate", message: "Too many deletes." }, redirectTo: `/purchases/${id}` }, `/purchases/${id}`);
    }
    const removed = deletePurchase(db, identity.user.id, id);
    if (!removed.ok) {
      return finish(request, removed.code === "sample" ? 403 : 404, { ok: false, error: { code: removed.code, message: removed.message }, redirectTo: "/purchases" }, "/purchases");
    }
    return finish(request, 200, { ok: true, notice: "deleted", redirectTo: "/purchases" }, "/purchases");
  } catch (error) {
    logFailure({ scope: "purchases", code: "unexpected", detail: error instanceof Error ? error.name : "error" });
    return finish(request, 500, { ok: false, error: { code: "generic", message: "Rewind could not delete that purchase." } }, "/purchases");
  }
}
