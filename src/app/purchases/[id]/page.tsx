import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { buttonClass } from "@/components/ui/button";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { formatMinor } from "@/lib/money";
import { OpportunityList } from "@/components/product/opportunity-list";
import { listPurchaseOpportunities } from "@/lib/opportunities/opportunities";
import { getPurchase } from "@/lib/purchases/purchases";
import { listPurchaseFiles } from "@/lib/receipts/files";
import { formatCalendarDate } from "@/lib/time";

export const metadata: Metadata = { title: "Purchase" };

export default async function PurchasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const db = getDb();
  const user = await readSessionUser(db);
  const record = getPurchase(db, id, user?.id ?? null);
  if (!record) notFound();
  const opportunityRows = listPurchaseOpportunities(db, record.purchase.id);
  const files = listPurchaseFiles(db, record.purchase.id, user?.id ?? null);
  const sample = record.purchase.isDemo === 1;
  const { purchase } = record;

  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <Link href="/purchases" className="text-sm font-semibold text-muted underline decoration-lime decoration-2 underline-offset-4">
        Purchases
      </Link>
      <div className="mt-4 flex flex-wrap gap-2">
        {sample ? <Badge tone="sample">Sample — not your purchase</Badge> : <Badge tone="lime">Your purchase</Badge>}
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold sm:text-5xl">{purchase.merchantName}</h1>
          <p className="mt-2 text-base text-muted">{formatCalendarDate(purchase.boughtOn)}</p>
        </div>
        <p className="amount font-display text-4xl font-semibold">{formatMinor(purchase.totalAmountMinor, purchase.currency)}</p>
      </div>
      <div className="mt-5">
        <Notice error={query.error} notice={query.notice} />
      </div>
      <table className="mt-6 w-full text-left">
        <caption className="sr-only">Line items</caption>
        <thead>
          <tr className="border-b border-line text-sm text-muted">
            <th scope="col" className="py-2 font-semibold">Item</th>
            <th scope="col" className="py-2 text-right font-semibold">Qty</th>
            <th scope="col" className="py-2 text-right font-semibold">Line</th>
          </tr>
        </thead>
        <tbody>
          {record.items.map((item) => (
            <tr key={item.id} className="border-b border-dashed border-line">
              <th scope="row" className="py-3 pr-3 font-semibold break-words">{item.description}</th>
              <td className="amount py-3 text-right">{item.quantity}</td>
              <td className="amount py-3 text-right font-semibold">{formatMinor(item.lineTotalMinor, purchase.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-sm text-muted">
        Total {formatMinor(purchase.totalAmountMinor, purchase.currency)} is the sum of the lines, stored in cents. Rewind did not use a separate total you typed.
      </p>
      {record.note ? (
        <section className="mt-6 rounded-3xl border border-line bg-card px-5 py-4">
          <h2 className="text-lg font-semibold">Receipt note</h2>
          <p className="mt-2 text-base leading-7 whitespace-pre-wrap">{record.note}</p>
          <p className="mt-2 text-sm text-muted">You typed this. Rewind did not extract it from a file.</p>
        </section>
      ) : null}
      <section className="mt-6" aria-labelledby="windows-heading">
        <h2 id="windows-heading" className="text-lg font-semibold">Windows from stored policies</h2>
        <p className="mt-2 mb-4 text-sm leading-6 text-muted">An estimate is not money received. Rewind has not contacted the store.</p>
        <OpportunityList rows={opportunityRows} />
      </section>
      {sample ? null : (
        <section className="mt-6 rounded-3xl border border-line bg-card px-5 py-4">
          <h2 className="text-lg font-semibold">Receipt file</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Optional. Rewind stores the file for this browser only. It does not scan it for malware and it does not read the text. Status: not scanned.
          </p>
          <form action="/api/receipts/upload" method="post" encType="multipart/form-data" className="mt-4 flex flex-col gap-3">
            <input type="hidden" name="purchase_id" value={purchase.id} />
            <label className="text-sm font-semibold" htmlFor="receipt-file">
              PDF, PNG, JPEG, or WEBP, up to 5 MB
            </label>
            <input id="receipt-file" name="file" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="text-base" />
            <button className={buttonClass("secondary")} type="submit">
              Attach file
            </button>
          </form>
          {files.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No file attached.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {files.map((file) => (
                <li key={file.id} className="flex flex-wrap items-center justify-between gap-3">
                  <a className="font-semibold underline decoration-lime decoration-2 underline-offset-4" href={`/api/receipts/${file.id}`}>
                    {file.originalName ?? "Receipt"}
                  </a>
                  <span className="text-sm font-semibold">Not scanned</span>
                  <form action={`/api/receipts/${file.id}/delete`} method="post">
                    <button className={buttonClass("ghost")} type="submit">
                      Remove file
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {sample ? (
        <p className="mt-6 text-base leading-7">This sample stays read-only so it is not mixed up with a receipt you add.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <Link href={`/purchases/${purchase.id}/edit`} className={buttonClass("secondary")}>
            Edit purchase
          </Link>
          <details className="rounded-3xl border border-line bg-card px-5 py-4">
            <summary className="cursor-pointer text-base font-semibold">Delete this purchase</summary>
            <p className="mt-3 text-base leading-7 text-muted">This removes the purchase and its note from your ledger. It cannot be undone.</p>
            <form action={`/api/purchases/${purchase.id}/delete`} method="post" className="mt-4">
              <button className={buttonClass("danger")} type="submit">
                Delete purchase
              </button>
            </form>
          </details>
        </div>
      )}
    </main>
  );
}
