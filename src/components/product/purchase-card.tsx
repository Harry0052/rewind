import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatMinor } from "@/lib/money";
import { formatCalendarDate } from "@/lib/time";

export function PurchaseCard({
  id,
  merchantName,
  boughtOn,
  currency,
  totalAmountMinor,
  sample,
}: {
  id: string;
  merchantName: string;
  boughtOn: string;
  currency: string;
  totalAmountMinor: number;
  sample?: boolean;
}) {
  return (
    <Link
      href={`/purchases/${id}`}
      className="receipt-edge block rounded-3xl border border-line bg-card px-5 pt-5 pb-7 transition-colors duration-150 hover:border-ink"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">{sample ? <Badge tone="sample">Sample</Badge> : <Badge tone="quiet">Your purchase</Badge>}</div>
          <h2 className="font-display text-2xl font-semibold">{merchantName}</h2>
          <p className="mt-1 text-sm text-muted">{formatCalendarDate(boughtOn)}</p>
        </div>
        <p className="amount font-display text-2xl font-semibold">{formatMinor(totalAmountMinor, currency)}</p>
      </div>
    </Link>
  );
}
