import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { readOwnedReceipt } from "@/lib/receipts/files";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const db = getDb();
  const user = await readSessionUser(db);
  const file = readOwnedReceipt(db, id, user?.id ?? null);
  if (!file) {
    return Response.json({ ok: false, error: { code: "not_found", message: "That file is not in this browser." } }, { status: 404 });
  }
  return new Response(file.bytes, {
    headers: {
      "content-type": file.row.mimeType ?? "application/octet-stream",
      "content-disposition": `attachment; filename="${(file.row.originalName ?? "receipt").replace(/"/g, "")}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
