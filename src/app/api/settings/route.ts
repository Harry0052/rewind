import { finish, readPayload, rejectOrigin } from "@/lib/api";
import { ensureUser } from "@/lib/auth/session";
import { updateProfile } from "@/lib/auth/users";
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
    if (!identity.ok) {
      return finish(request, 500, { ok: false, error: { code: "generic", message: identity.message } }, "/settings");
    }
    if (!consumeRateLimit(db, `settings:${identity.user.id}`, LIMITS.settings.limit, LIMITS.settings.windowMs)) {
      return finish(request, 429, { ok: false, error: { code: "rate", message: "Too many saves." }, redirectTo: "/settings" }, "/settings");
    }
    const saved = updateProfile(db, identity.user.id, {
      displayName: payload.display_name ?? "",
      timezone: payload.timezone ?? "",
    });
    if (!saved.ok) {
      return finish(request, 400, { ok: false, error: { code: saved.code, message: saved.message }, redirectTo: "/settings" }, "/settings");
    }
    return finish(request, 200, { ok: true, notice: "profile", redirectTo: "/settings" }, "/settings");
  } catch (error) {
    logFailure({ scope: "settings", code: "unexpected", detail: error instanceof Error ? error.name : "error" });
    return finish(request, 500, { ok: false, error: { code: "generic", message: "Rewind could not save settings." } }, "/settings");
  }
}
