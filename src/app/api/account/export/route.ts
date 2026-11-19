import { readSessionUser } from "@/lib/auth/session";
import { exportAccount } from "@/lib/account/account";
import { getDb } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const user = await readSessionUser(db);
  if (!user) {
    return Response.json({ ok: false, error: { code: "forbidden", message: "Save a session before downloading data." } }, { status: 401 });
  }
  const data = exportAccount(db, user.id);
  if (!data) {
    return Response.json({ ok: false, error: { code: "forbidden", message: "That session is not on this server." } }, { status: 404 });
  }
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": "attachment; filename=\"rewind-data.json\"",
      "cache-control": "private, no-store",
    },
  });
}
