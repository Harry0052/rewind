import { finish, rejectOrigin } from "@/lib/api";
import { ensureUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { deleteReceiptFile } from "@/lib/receipts/files";
import { LIMITS, consumeRateLimit } from "@/lib/security/rate-limit";
import { logFailure } from "@/lib/observability";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const blocked = rejectOrigin(request, "/purchases");
  if (blocked) return blocked;
  try {
    const db = getDb();
    const identity = await ensureUser(db, request);
    if (!identity.ok) return finish(request, 500, { ok: false, error: { code: "generic", message: identity.message } }, "/purchases");
    if (!consumeRateLimit(db, `upload:${identity.user.id}`, LIMITS.upload.limit, LIMITS.upload.windowMs)) {
      return finish(request, 429, { ok: false, error: { code: "rate", message: "Too many deletes." }, redirectTo: "/purchases" }, "/purchases");
    }
    const removed = deleteReceiptFile(db, identity.user.id, id);
    if (!removed.ok) {
      return finish(request, 404, { ok: false, error: { code: removed.code, message: removed.message }, redirectTo: "/purchases" }, "/purchases");
    }
    return finish(request, 200, { ok: true, notice: "file_deleted", redirectTo: `/purchases/${removed.purchaseId}` }, `/purchases/${removed.purchaseId}`);
  } catch (error) {
    logFailure({ scope: "receipts", code: "unexpected", detail: error instanceof Error ? error.name : "error" });
    return finish(request, 500, { ok: false, error: { code: "generic", message: "Rewind could not delete that file." } }, "/purchases");
  }
}
