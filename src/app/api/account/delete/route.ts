import { finish, readPayload, rejectOrigin } from "@/lib/api";
import { clearSessionCookie, ensureUser } from "@/lib/auth/session";
import { deleteAccount } from "@/lib/account/account";
import { getDb } from "@/lib/db/client";
import { logFailure } from "@/lib/observability";
import { LIMITS, consumeRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const blocked = rejectOrigin(request, "/settings");
  if (blocked) return blocked;
  try {
    const payload = await readPayload(request);
    const db = getDb();
    const identity = await ensureUser(db, request);
    if (!identity.ok) return finish(request, 500, { ok: false, error: { code: "generic", message: identity.message } }, "/settings");
    if (!consumeRateLimit(db, `account:${identity.user.id}`, LIMITS.account.limit, LIMITS.account.windowMs)) {
      return finish(request, 429, { ok: false, error: { code: "rate", message: "Too many attempts." }, redirectTo: "/settings" }, "/settings");
    }
    if (payload.confirm !== "DELETE") {
      return finish(request, 400, { ok: false, error: { code: "confirm", message: "Type DELETE to remove your data." }, redirectTo: "/settings" }, "/settings");
    }
    const removed = deleteAccount(db, identity.user.id);
    if (!removed.ok) {
      return finish(request, 403, { ok: false, error: { code: removed.code, message: removed.message }, redirectTo: "/settings" }, "/settings");
    }
    await clearSessionCookie(request);
    return finish(request, 200, { ok: true, notice: "deleted_account", redirectTo: "/" }, "/");
  } catch (error) {
    logFailure({ scope: "account", code: "unexpected", detail: error instanceof Error ? error.name : "error" });
    return finish(request, 500, { ok: false, error: { code: "generic", message: "Rewind could not delete that data." } }, "/settings");
  }
}
