import { readSessionUser } from "@/lib/auth/session";
import { getCase } from "@/lib/cases/cases";
import { getDb } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const db = getDb();
  const user = await readSessionUser(db);
  const record = getCase(db, id, user?.id ?? null);
  if (!record) {
    return Response.json({ ok: false, error: { code: "not_found", message: "That case is not in this browser." } }, { status: 404 });
  }
  const text = `${record.caseRow.subject}\n\n${record.caseRow.body}\n`;
  return new Response(text, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="rewind-case.txt"`,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
