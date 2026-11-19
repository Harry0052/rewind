import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { readSessionUser } from "@/lib/auth/session";
import { listOwnCases } from "@/lib/cases/cases";
import { getDb } from "@/lib/db/client";
import { formatMinor } from "@/lib/money";

export const metadata: Metadata = { title: "Cases" };

const labels: Record<string, string> = {
  draft: "Not sent",
  recorded_sent: "You recorded a send",
  won: "You confirmed a refund",
  denied: "You recorded a denial",
  withdrawn: "Withdrawn",
};

export default async function CasesPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const query = await searchParams;
  const db = getDb();
  const user = await readSessionUser(db);
  const rows = user ? listOwnCases(db, user.id) : [];
  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <p className="text-sm font-semibold tracking-[0.14em] text-muted uppercase">Requests</p>
      <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Cases</h1>
      <p className="mt-3 max-w-xl text-base leading-7 text-muted">A case stays not sent until you record that you sent it yourself.</p>
      <div className="mt-5">
        <Notice error={query.error} notice={query.notice} />
      </div>
      {rows.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-dashed border-line bg-card px-5 py-8 text-base leading-7">
          No cases in this browser. Add a purchase, open an eligible window, and prepare a request.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Link href={`/cases/${row.id}`} className="block rounded-3xl border border-line bg-card px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">{row.subject}</h2>
                  <Badge tone={row.status === "won" ? "ink" : row.status === "draft" ? "quiet" : "lime"}>{labels[row.status] ?? row.status}</Badge>
                </div>
                {row.status === "won" && row.resultAmountMinor != null && row.resultCurrency ? (
                  <p className="amount mt-2 font-semibold">Confirmed {formatMinor(row.resultAmountMinor, row.resultCurrency)}</p>
                ) : (
                  <p className="mt-2 text-sm text-muted">Not counted as money received.</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
