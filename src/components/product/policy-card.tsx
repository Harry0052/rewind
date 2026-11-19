import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatMinor } from "@/lib/money";
import { describeWindow, policyTypeLabel } from "@/lib/policies/samples";
import { formatCalendarDate } from "@/lib/time";

export function PolicyCard({
  slug,
  merchantName,
  policyType,
  windowDays,
  inclusive,
  timezone,
  recordedAt,
  minAmountMinor,
  currency,
  isDemo,
}: {
  slug: string;
  merchantName: string;
  policyType: string;
  windowDays: number;
  inclusive: number;
  timezone: string;
  recordedAt: string;
  minAmountMinor: number | null;
  currency: string;
  isDemo: number;
}) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-line bg-card p-5 shadow-[0_1px_0_rgba(22,33,42,0.04)]">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {isDemo === 1 ? <Badge tone="sample">Sample policy</Badge> : <Badge>Stored policy</Badge>}
        <Badge tone="quiet">{policyTypeLabel(policyType)}</Badge>
      </div>
      <h2 className="font-display text-2xl leading-tight font-semibold">{merchantName}</h2>
      <p className="mt-3 text-base text-ink">{describeWindow(windowDays, inclusive === 1)}</p>
      <dl className="mt-4 grid gap-3 text-sm">
        <div className="flex items-baseline justify-between gap-4 border-t border-dashed border-line pt-3">
          <dt className="text-muted">Clock for the deadline</dt>
          <dd className="text-right font-semibold">{timezone}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">Recorded in Rewind</dt>
          <dd className="text-right font-semibold">{formatCalendarDate(recordedAt)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">Amount condition</dt>
          <dd className="amount text-right font-semibold">
            {minAmountMinor == null ? "None stored" : `At least ${formatMinor(minAmountMinor, currency)}`}
          </dd>
        </div>
      </dl>
      <Link
        href={`/policies/${slug}`}
        className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl bg-ink px-4 text-base font-semibold text-paper"
      >
        Read this policy
      </Link>
    </article>
  );
}
