import { NextResponse } from "next/server";
import { finish, readFormLists, rejectOrigin } from "@/lib/api";
import { ensureUser, readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { logFailure } from "@/lib/observability";
import { getPurchase, updatePurchase } from "@/lib/purchases/purchases";
import { LIMITS, consumeRateLimit } from "@/lib/security/rate-limit";
import { DEFAULT_TIMEZONE } from "@/lib/time";
import { invalidPurchase } from "@/lib/purchases/http";
import { slotsFromLists, validatePurchase } from "@/lib/validators/purchase";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const db = getDb();
  const user = await readSessionUser(db);
  const record = getPurchase(db, id, user?.id ?? null);
  if (!record) return NextResponse.json({ ok: false, error: { code: "not_found", message: "That purchase is not in this browser." } }, { status: 404 });
  return NextResponse.json(
    {
      ok: true,
      purchase: {
        id: record.purchase.id,
        merchantName: record.purchase.merchantName,
        boughtOn: record.purchase.boughtOn,
        currency: record.purchase.currency,
        totalAmountMinor: record.purchase.totalAmountMinor,
        isDemo: record.purchase.isDemo === 1,
        items: record.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPriceMinor: item.unitPriceMinor,
          lineTotalMinor: item.lineTotalMinor,
        })),
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const fallback = `/purchases/${id}/edit`;
  const blocked = rejectOrigin(request, fallback);
  if (blocked) return blocked;
  try {
    const { fields, lists } = await readFormLists(request);
    const db = getDb();
    const identity = await ensureUser(db, request);
    if (!identity.ok) {
      return finish(request, 500, { ok: false, error: { code: "generic", message: identity.message } }, fallback);
    }
    if (!consumeRateLimit(db, `purchase:${identity.user.id}`, LIMITS.purchase.limit, LIMITS.purchase.windowMs)) {
      return finish(request, 429, { ok: false, error: { code: "rate", message: "Too many saves." }, redirectTo: fallback }, fallback);
    }
    const validated = validatePurchase(
      {
        merchantName: fields.merchant_name ?? "",
        boughtOn: fields.bought_on ?? "",
        currency: fields.currency ?? "",
        note: fields.note ?? "",
        slots: slotsFromLists(lists),
      },
      identity.user.timezone || DEFAULT_TIMEZONE,
    );
    if (!validated.ok) return invalidPurchase(request, fallback, validated.code, fields, lists);
    const updated = updatePurchase(db, identity.user.id, id, validated.draft);
    if (!updated.ok) {
      const status = updated.code === "sample" ? 403 : 404;
      return finish(request, status, { ok: false, error: { code: updated.code, message: updated.message }, redirectTo: "/purchases" }, "/purchases");
    }
    return finish(request, 200, { ok: true, notice: "saved", redirectTo: `/purchases/${id}` }, `/purchases/${id}`);
  } catch (error) {
    logFailure({ scope: "purchases", code: "unexpected", detail: error instanceof Error ? error.name : "error" });
    return finish(request, 500, { ok: false, error: { code: "generic", message: "Rewind could not update that purchase." } }, fallback);
  }
}
