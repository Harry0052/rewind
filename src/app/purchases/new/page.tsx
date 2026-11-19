import type { Metadata } from "next";
import Link from "next/link";
import { emptySlots, PurchaseForm, slotsFromQuery } from "@/components/product/purchase-form";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { calendarDateInZone, DEFAULT_TIMEZONE } from "@/lib/time";

export const metadata: Metadata = { title: "Add a purchase" };

export default async function NewPurchasePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const user = await readSessionUser(getDb());
  const timezone = user?.timezone ?? DEFAULT_TIMEZONE;
  const error = typeof query.error === "string" ? query.error : undefined;
  const slots = slotsFromQuery(query, emptySlots());
  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-8 md:px-6 md:py-12">
      <Link href="/purchases" className="text-sm font-semibold text-muted underline decoration-lime decoration-2 underline-offset-4">
        Purchases
      </Link>
      <h1 className="mt-3 font-display text-4xl font-semibold">Add a purchase</h1>
      <p className="mt-3 text-base leading-7 text-muted">
        Type what is on the receipt. Rewind adds the lines in cents and stores the purchase for this browser.
      </p>
      <div className="mt-6">
        <PurchaseForm
          action="/api/purchases"
          error={error}
          submitLabel="Save purchase"
          defaults={{
            merchant: text(query.merchant),
            boughtOn: text(query.bought_on),
            currency: text(query.currency) || "USD",
            note: text(query.note),
            slots,
            maxDate: calendarDateInZone(new Date(), timezone),
          }}
        />
      </div>
    </main>
  );
}

function text(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
