import { NextResponse } from "next/server";
import { finish, readFormLists, rejectOrigin } from "@/lib/api";
import { ensureUser, readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { logFailure } from "@/lib/observability";
import { createPurchase, listOwnPurchases } from "@/lib/purchases/purchases";
import { LIMITS, consumeRateLimit } from "@/lib/security/rate-limit";
import { DEFAULT_TIMEZONE } from "@/lib/time";
import { invalidPurchase } from "@/lib/purchases/http";
import { slotsFromLists, validatePurchase } from "@/lib/validators/purchase";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const user = await readSessionUser(db);
  if (!user) return NextResponse.json({ ok: true, purchases: [] }, { headers: { "cache-control": "no-store" } });
  const rows = listOwnPurchases(db, user.id);
  return NextResponse.json(
    {
      ok: true,
      purchases: rows.map((row) => ({
        id: row.id,
        merchantName: row.merchantName,
        boughtOn: row.boughtOn,
        currency: row.currency,
        totalAmountMinor: row.totalAmountMinor,
      })),
    },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const blocked = rejectOrigin(request, "/purchases/new");
  if (blocked) return blocked;
  try {
    const { fields, lists } = await readFormLists(request);
    const db = getDb();
    const identity = await ensureUser(db, request);
    if (!identity.ok) {
      return finish(request, 500, { ok: false, error: { code: "generic", message: identity.message } }, "/purchases/new");
    }
    if (!consumeRateLimit(db, `purchase:${identity.user.id}`, LIMITS.purchase.limit, LIMITS.purchase.windowMs)) {
      return finish(request, 429, { ok: false, error: { code: "rate", message: "Too many purchases." }, redirectTo: "/purchases/new" }, "/purchases/new");
    }
    const slots = slotsFromLists(lists);
    const validated = validatePurchase(
      {
        merchantName: fields.merchant_name ?? "",
        boughtOn: fields.bought_on ?? "",
        currency: fields.currency ?? "",
        note: fields.note ?? "",
        slots,
      },
      identity.user.timezone || DEFAULT_TIMEZONE,
    );
    if (!validated.ok) {
      return invalidPurchase(request, "/purchases/new", validated.code, fields, lists);
    }
    const id = createPurchase(db, identity.user.id, validated.draft);
    return finish(request, 200, { ok: true, notice: "created", redirectTo: `/purchases/${id}` }, `/purchases/${id}`);
  } catch (error) {
    logFailure({ scope: "purchases", code: "unexpected", detail: error instanceof Error ? error.name : "error" });
    return finish(request, 500, { ok: false, error: { code: "generic", message: "Rewind could not save that purchase." } }, "/purchases/new");
  }
}
