import { finish, rejectOrigin } from "@/lib/api";
import { ensureUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { logFailure } from "@/lib/observability";
import { saveReceiptFile } from "@/lib/receipts/files";
import { LIMITS, consumeRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const blocked = rejectOrigin(request, "/purchases");
  if (blocked) return blocked;
  try {
    const form = await request.formData();
    const purchaseId = String(form.get("purchase_id") ?? "");
    const fallback = `/purchases/${purchaseId}`;
    const file = form.get("file");
    const db = getDb();
    const identity = await ensureUser(db, request);
    if (!identity.ok) return finish(request, 500, { ok: false, error: { code: "generic", message: identity.message } }, "/purchases");
    if (!consumeRateLimit(db, `upload:${identity.user.id}`, LIMITS.upload.limit, LIMITS.upload.windowMs)) {
      return finish(request, 429, { ok: false, error: { code: "rate", message: "Too many files." }, redirectTo: fallback }, fallback);
    }
    if (!(file instanceof File)) {
      return finish(request, 400, { ok: false, error: { code: "file", message: "Choose a file first." }, redirectTo: fallback }, fallback);
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const saved = saveReceiptFile(db, identity.user.id, purchaseId, file.name, bytes);
    if (!saved.ok) {
      return finish(request, saved.code === "not_found" ? 404 : 400, { ok: false, error: { code: saved.code, message: saved.message }, redirectTo: fallback }, fallback);
    }
    return finish(request, 200, { ok: true, notice: "uploaded", redirectTo: fallback }, fallback);
  } catch (error) {
    logFailure({ scope: "receipts", code: "unexpected", detail: error instanceof Error ? error.name : "error" });
    return finish(request, 500, { ok: false, error: { code: "generic", message: "Rewind could not store that file." } }, "/purchases");
  }
}
