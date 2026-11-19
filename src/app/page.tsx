import Link from "next/link";
import { PurchaseCard } from "@/components/product/purchase-card";
import { buttonClass } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { listActivePolicies } from "@/lib/policies/catalog";
import { describeWindow, policyTypeLabel } from "@/lib/policies/samples";
import { listOwnCases, recoveredByCurrency } from "@/lib/cases/cases";
import { formatMinor } from "@/lib/money";
import { listOwnOpportunities, openEstimatesByCurrency } from "@/lib/opportunities/opportunities";
import { listOwnPurchases, listSamplePurchases } from "@/lib/purchases/purchases";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const query = await searchParams;
  const db = getDb();
  const user = await readSessionUser(db);
  const own = user ? listOwnPurchases(db, user.id) : [];
  const estimates = user ? openEstimatesByCurrency(listOwnOpportunities(db, user.id), user.id) : [];
  const recovered = user ? recoveredByCurrency(listOwnCases(db, user.id)) : [];
  const samples = listSamplePurchases(db);
  const policies = listActivePolicies(db);

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-6">
        <Notice error={query.error} notice={query.notice} />
      </div>
      <section className="max-w-2xl">
        <p className="text-sm font-semibold tracking-[0.14em] text-muted uppercase">After checkout</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] font-semibold text-balance sm:text-6xl">
          See what you can still ask for.
        </h1>
        <p className="mt-5 text-lg leading-8 text-muted">
          Add a purchase from a receipt you have. Rewind stores the lines and adds them in cents. It does not contact the store.
        </p>
        <div className="mt-6">
          <Link href="/purchases/new" className={buttonClass("primary", "xl") + " sm:w-auto"}>
            Add a purchase
          </Link>
        </div>
        <dl className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl bg-card px-5 py-4 border border-line">
            <dt className="text-sm font-semibold text-muted">Estimated, still open</dt>
            <dd className="amount mt-2 font-display text-3xl font-semibold">
              {estimates.length === 0 ? "None" : estimates.map((row) => formatMinor(row.amountMinor, row.currency)).join(" · ")}
            </dd>
            <p className="mt-2 text-sm leading-6 text-muted">A calculation from stored policies. Not money you have received.</p>
          </div>
          <div className="rounded-3xl bg-ink px-5 py-4 text-paper">
            <dt className="text-sm font-semibold text-lime">Recorded as received</dt>
            <dd className="amount mt-2 font-display text-3xl font-semibold">
              {recovered.length === 0 ? "None" : recovered.map((row) => formatMinor(row.amountMinor, row.currency)).join(" · ")}
            </dd>
            <p className="mt-2 text-sm leading-6 text-paper/80">Only amounts you mark as received. Estimates are not added here.</p>
          </div>
        </dl>
      </section>

      <section className="mt-12" aria-labelledby="yours-heading">
        <h2 id="yours-heading" className="font-display text-3xl font-semibold">
          Your purchases
        </h2>
        {own.length === 0 ? (
          <p className="mt-4 max-w-xl rounded-3xl border border-dashed border-line bg-card px-5 py-6 text-base leading-7">
            Nothing is saved for this browser yet. A sample ledger is kept separate below so it is not counted as yours.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {own.map((purchase) => (
              <PurchaseCard key={purchase.id} id={purchase.id} merchantName={purchase.merchantName} boughtOn={purchase.boughtOn} currency={purchase.currency} totalAmountMinor={purchase.totalAmountMinor} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12" aria-labelledby="sample-heading">
        <h2 id="sample-heading" className="font-display text-3xl font-semibold">
          Sample ledger
        </h2>
        <p className="mt-2 max-w-2xl text-base text-muted">Labeled Sample. These are not your receipts, and the totals are the stored line sums.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {samples.map((purchase) => (
            <PurchaseCard key={purchase.id} sample id={purchase.id} merchantName={purchase.merchantName} boughtOn={purchase.boughtOn} currency={purchase.currency} totalAmountMinor={purchase.totalAmountMinor} />
          ))}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="policies-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="policies-heading" className="font-display text-3xl font-semibold">
            Policies on file
          </h2>
          <Link href="/policies" className="font-semibold underline decoration-lime decoration-2 underline-offset-4">
            Read the policies
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-line rounded-3xl border border-line bg-card">
          {policies.map((policy) => (
            <li key={policy.id}>
              <Link href={`/policies/${policy.slug}`} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:justify-between">
                <span className="font-semibold">
                  {policy.merchantName}
                  <span className="ml-2 text-sm font-semibold text-muted">{policyTypeLabel(policy.policyType)} · Sample</span>
                </span>
                <span className="text-sm text-muted">{describeWindow(policy.windowDays, policy.inclusive === 1)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
