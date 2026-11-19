import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatMinor } from "@/lib/money";
import { policyTypeLabel } from "@/lib/policies/samples";
import { formatCalendarDate } from "@/lib/time";

const tone = {
  eligible: "lime",
  expired: "quiet",
  outside_conditions: "caution",
} as const;

const label = {
  eligible: "Open under the stored policy",
  expired: "Window closed",
  outside_conditions: "Outside the stored conditions",
} as const;

export function OpportunityList({
  rows,
}: {
  rows: {
    id: string;
    type: string;
    status: string;
    deadline: string;
    currency: string;
    estimatedAmountMinor: number | null;
    explanation: string;
  }[];
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-line bg-card px-5 py-6 text-base leading-7">
        No policy on file for this store. Rewind will not guess a return window.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => {
        const status = row.status === "eligible" || row.status === "expired" || row.status === "outside_conditions" ? row.status : "expired";
        return (
          <li key={row.id} className="rounded-3xl border border-line bg-card px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">{policyTypeLabel(row.type)}</h3>
              <Badge tone={tone[status]}>{label[status]}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted">Last day {formatCalendarDate(row.deadline)}</p>
            <p className="amount mt-2 text-base font-semibold">
              {row.estimatedAmountMinor == null ? "No dollar estimate" : `Estimate ${formatMinor(row.estimatedAmountMinor, row.currency)}`}
            </p>
            <p className="mt-3 text-base leading-7">{row.explanation}</p>
            <Link href={`/opportunities/${row.id}`} className="mt-4 inline-flex min-h-12 items-center font-semibold underline decoration-lime decoration-2 underline-offset-4">
              Open {policyTypeLabel(row.type)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
