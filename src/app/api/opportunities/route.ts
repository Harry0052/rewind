import { NextResponse } from "next/server";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { listOwnOpportunities, openEstimatesByCurrency } from "@/lib/opportunities/opportunities";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const user = await readSessionUser(db);
  if (!user) {
    return NextResponse.json({ ok: true, opportunities: [], estimates: [] }, { headers: { "cache-control": "no-store" } });
  }
  const rows = listOwnOpportunities(db, user.id);
  return NextResponse.json(
    {
      ok: true,
      opportunities: rows.map((row) => ({
        id: row.id,
        purchaseId: row.purchaseId,
        type: row.type,
        status: row.status,
        deadline: row.deadline,
        estimatedAmountMinor: row.estimatedAmountMinor,
        currency: row.currency,
      })),
      estimates: openEstimatesByCurrency(rows, user.id),
      recovered: [],
    },
    { headers: { "cache-control": "no-store" } },
  );
}
