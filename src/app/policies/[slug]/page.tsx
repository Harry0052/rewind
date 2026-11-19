import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getDb } from "@/lib/db/client";
import { formatMinor } from "@/lib/money";
import { getPolicyBySlug } from "@/lib/policies/catalog";
import { describeWindow, policyTypeLabel } from "@/lib/policies/samples";
import { formatCalendarDate } from "@/lib/time";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicyBySlug(getDb(), slug);
  return { title: policy ? policy.sourceTitle : "Policy" };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = getPolicyBySlug(getDb(), slug);
  if (!policy) notFound();

  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <Link href="/policies" className="text-sm font-semibold text-muted underline decoration-lime decoration-2 underline-offset-4">
        All policies
      </Link>
      <div className="mt-4 flex flex-wrap gap-2">
        {policy.isDemo === 1 ? <Badge tone="sample">Sample policy</Badge> : <Badge>Stored policy</Badge>}
        <Badge tone="quiet">Version {policy.version}</Badge>
        <Badge tone="quiet">{policyTypeLabel(policy.policyType)}</Badge>
      </div>
      <h1 className="mt-4 font-display text-4xl leading-tight font-semibold sm:text-5xl">{policy.merchantName}</h1>
      <p className="mt-4 text-lg leading-8">{policy.conditionsNote}</p>
      {policy.isDemo === 1 ? (
        <p className="mt-4 rounded-2xl bg-caution-bg px-4 py-3 text-base font-semibold text-caution">
          This is not a real store and not a live policy page. Rewind will not present it as a merchant guarantee.
        </p>
      ) : null}

      <dl className="mt-8 divide-y divide-dashed divide-line rounded-3xl border border-line bg-card">
        <Row label="Window" value={describeWindow(policy.windowDays, policy.inclusive === 1)} />
        <Row label="Deadline clock" value={policy.timezone} />
        <Row label="Recorded in Rewind" value={formatCalendarDate(policy.recordedAt)} />
        <Row
          label="Amount condition"
          value={policy.minAmountMinor == null ? "None stored" : `At least ${formatMinor(policy.minAmountMinor, policy.currency)}`}
        />
        <Row label="Source title" value={policy.sourceTitle} />
        <Row label="Source" value={policy.sourceUrl} />
      </dl>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 px-5 py-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm font-semibold text-muted">{label}</dt>
      <dd className="text-base font-semibold break-words">{value}</dd>
    </div>
  );
}
