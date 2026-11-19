import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { emptySlots, PurchaseForm, slotsFromQuery, type FormSlot } from "@/components/product/purchase-form";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { formatMinor } from "@/lib/money";
import { getPurchase } from "@/lib/purchases/purchases";
import { calendarDateInZone, DEFAULT_TIMEZONE } from "@/lib/time";

export const metadata: Metadata = { title: "Edit purchase" };

export default async function EditPurchasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const db = getDb();
  const user = await readSessionUser(db);
  const record = getPurchase(db, id, user?.id ?? null);
  if (!record || record.purchase.isDemo === 1 || record.purchase.userId !== user?.id) notFound();

  const savedSlots: FormSlot[] = emptySlots();
  record.items.forEach((item, index) => {
    if (index > 4) return;
    const whole = Math.floor(item.unitPriceMinor / 100);
    const cents = String(item.unitPriceMinor % 100).padStart(2, "0");
    savedSlots[index] = { description: item.description, quantity: String(item.quantity), price: `${whole}.${cents}` };
  });
  const error = typeof query.error === "string" ? query.error : undefined;
  const slots = error ? slotsFromQuery(query, savedSlots) : savedSlots;

  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-8 md:px-6 md:py-12">
      <Link href={`/purchases/${id}`} className="text-sm font-semibold text-muted underline decoration-lime decoration-2 underline-offset-4">
        Back to purchase
      </Link>
      <h1 className="mt-3 font-display text-4xl font-semibold">Edit purchase</h1>
      <p className="mt-3 text-base leading-7 text-muted">
        Current total {formatMinor(record.purchase.totalAmountMinor, record.purchase.currency)}. Saving replaces the lines and recalculates the total.
      </p>
      <div className="mt-6">
        <PurchaseForm
          action={`/api/purchases/${id}`}
          error={error}
          submitLabel="Save changes"
          defaults={{
            merchant: text(query.merchant) || record.purchase.merchantName,
            boughtOn: text(query.bought_on) || record.purchase.boughtOn,
            currency: text(query.currency) || record.purchase.currency,
            note: error ? text(query.note) : (record.note ?? ""),
            slots,
            maxDate: calendarDateInZone(new Date(), user?.timezone ?? DEFAULT_TIMEZONE),
          }}
        />
      </div>
    </main>
  );
}

function text(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
