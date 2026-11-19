import type { Metadata } from "next";
import { PolicyCard } from "@/components/product/policy-card";
import { getDb } from "@/lib/db/client";
import { listActivePolicies } from "@/lib/policies/catalog";

export const metadata: Metadata = { title: "Policies" };

export default function PoliciesPage() {
  const policies = listActivePolicies(getDb());
  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-12">
      <p className="text-sm font-semibold tracking-[0.14em] text-muted uppercase">Registry</p>
      <h1 className="mt-2 max-w-2xl font-display text-4xl font-semibold sm:text-5xl">Sample policies stored in Rewind</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
        These rows are labeled sample. The source link opens a page in this app. Rewind does not fetch a live merchant
        policy.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {policies.map((policy) => (
          <PolicyCard
            key={policy.id}
            slug={policy.slug}
            merchantName={policy.merchantName}
            policyType={policy.policyType}
            windowDays={policy.windowDays}
            inclusive={policy.inclusive}
            timezone={policy.timezone}
            recordedAt={policy.recordedAt}
            minAmountMinor={policy.minAmountMinor}
            currency={policy.currency}
            isDemo={policy.isDemo}
          />
        ))}
      </div>
    </main>
  );
}
