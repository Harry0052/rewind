import type { Metadata } from "next";
import Link from "next/link";
import { PurchaseCard } from "@/components/product/purchase-card";
import { Notice } from "@/components/ui/notice";
import { buttonClass } from "@/components/ui/button";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { listOwnPurchases, listSamplePurchases } from "@/lib/purchases/purchases";

export const metadata: Metadata = { title: "Purchases" };

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const db = getDb();
  const user = await readSessionUser(db);
  const own = user ? listOwnPurchases(db, user.id) : [];
  const samples = listSamplePurchases(db);

  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-[0.14em] text-muted uppercase">Ledger</p>
          <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Purchases</h1>
        </div>
        <Link href="/purchases/new" className={buttonClass("primary")}>
          Add a purchase
        </Link>
      </div>
      <div className="mt-5">
        <Notice error={query.error} notice={query.notice} />
      </div>
      <section className="mt-6" aria-labelledby="yours-heading">
        <h2 id="yours-heading" className="text-lg font-semibold">
          Yours
        </h2>
        {own.length === 0 ? (
          <p className="mt-3 rounded-3xl border border-dashed border-line bg-card px-5 py-8 text-base leading-7">
            No purchases in this browser yet. Add one from a receipt you have. Sample rows below are not yours.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {own.map((purchase) => (
              <PurchaseCard key={purchase.id} {...cardProps(purchase)} />
            ))}
          </div>
        )}
      </section>
      <section className="mt-10" aria-labelledby="sample-heading">
        <h2 id="sample-heading" className="text-lg font-semibold">
          Sample ledger
        </h2>
        <p className="mt-2 text-base text-muted">These rows are labeled Sample. You can open them. You cannot edit them.</p>
        <div className="mt-3 flex flex-col gap-3">
          {samples.map((purchase) => (
            <PurchaseCard key={purchase.id} {...cardProps(purchase)} sample />
          ))}
        </div>
      </section>
    </main>
  );
}

function cardProps(purchase: { id: string; merchantName: string; boughtOn: string; currency: string; totalAmountMinor: number }) {
  return {
    id: purchase.id,
    merchantName: purchase.merchantName,
    boughtOn: purchase.boughtOn,
    currency: purchase.currency,
    totalAmountMinor: purchase.totalAmountMinor,
  };
}
