import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { formatMinor } from "@/lib/money";
import { getOpportunity } from "@/lib/opportunities/opportunities";
import { policyTypeLabel } from "@/lib/policies/samples";
import { formatCalendarDate } from "@/lib/time";

export const metadata: Metadata = { title: "Opportunity" };

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const user = await readSessionUser(db);
  const record = getOpportunity(db, id, user?.id ?? null);
  if (!record || !record.policy) notFound();
  const { opportunity, purchase, policy } = record;
  const status =
    opportunity.status === "eligible" || opportunity.status === "expired" || opportunity.status === "outside_conditions"
      ? opportunity.status
      : "expired";
  const badge =
    status === "eligible" ? "Open under the stored policy" : status === "expired" ? "Window closed" : "Outside the stored conditions";

  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <Link href={`/purchases/${purchase.id}`} className="text-sm font-semibold text-muted underline decoration-lime decoration-2 underline-offset-4">
        {purchase.merchantName}
      </Link>
      <div className="mt-4 flex flex-wrap gap-2">
        {purchase.isDemo === 1 ? <Badge tone="sample">Sample</Badge> : null}
        <Badge tone={status === "eligible" ? "lime" : status === "outside_conditions" ? "caution" : "quiet"}>{badge}</Badge>
        {policy.isDemo === 1 ? <Badge tone="sample">Sample policy</Badge> : null}
      </div>
      <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">{policyTypeLabel(opportunity.type)}</h1>
      <p className="mt-3 text-base text-muted">Last day {formatCalendarDate(opportunity.deadline)} · clock {policy.timezone}</p>
      <p className="amount mt-4 font-display text-4xl font-semibold">
        {opportunity.estimatedAmountMinor == null ? "No dollar estimate" : formatMinor(opportunity.estimatedAmountMinor, opportunity.currency)}
      </p>
      <p className="mt-2 text-sm text-muted">
        {opportunity.estimatedAmountMinor == null
          ? "Rewind is not showing a refund figure it does not know."
          : "This estimate is the recorded purchase total. It is not confirmed savings."}
      </p>
      <p className="mt-6 text-lg leading-8">{opportunity.explanation}</p>
      <section className="mt-6 rounded-3xl border border-line bg-card px-5 py-4">
        <h2 className="text-lg font-semibold">Policy source</h2>
        <p className="mt-2 text-base">{policy.sourceTitle}</p>
        <p className="mt-1 text-sm text-muted">Recorded in Rewind on {formatCalendarDate(policy.recordedAt)}. Version {policy.version}.</p>
        <Link href={policy.sourceUrl} className="mt-3 inline-flex min-h-12 items-center font-semibold underline decoration-lime decoration-2 underline-offset-4">
          Read the stored policy
        </Link>
        <p className="mt-3 text-base leading-7">{policy.conditionsNote}</p>
      </section>
      <section className="mt-6 rounded-3xl bg-sand px-5 py-4">
        <h2 className="text-lg font-semibold">Prepare a request</h2>
        {status === "eligible" && purchase.isDemo !== 1 ? (
          <form action={`/api/opportunities/${opportunity.id}/case`} method="post" className="mt-3">
            <p className="text-base leading-7">Rewind will save a letter you can edit. It will not send the letter.</p>
            <button className={`${buttonClass("primary")} mt-4`} type="submit">
              Prepare request
            </button>
          </form>
        ) : (
          <p className="mt-2 text-base leading-7">
            {purchase.isDemo === 1
              ? "This sample is not your purchase, so Rewind will not prepare a request from it."
              : "Rewind will not prepare a request when the stored policy says the window is closed or the purchase is outside the conditions."}
          </p>
        )}
      </section>
    </main>
  );
}
