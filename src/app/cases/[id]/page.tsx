import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLetter } from "@/components/product/copy-letter";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { readSessionUser } from "@/lib/auth/session";
import { getCase } from "@/lib/cases/cases";
import { getDb } from "@/lib/db/client";
import { formatMinor } from "@/lib/money";
import { formatCalendarDate } from "@/lib/time";

export const metadata: Metadata = { title: "Case" };

export default async function CasePage({
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
  const record = getCase(db, id, user?.id ?? null);
  if (!record) notFound();
  const row = record.caseRow;
  const locked = row.status === "won" || row.status === "denied" || row.status === "withdrawn";
  const letter = `${row.subject}\n\n${row.body}`;

  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <Link href="/cases" className="text-sm font-semibold text-muted underline decoration-lime decoration-2 underline-offset-4">
        Cases
      </Link>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone={row.status === "draft" ? "quiet" : row.status === "won" ? "ink" : "lime"}>{statusLabel(row.status)}</Badge>
      </div>
      <h1 className="mt-3 font-display text-4xl font-semibold">Your request</h1>
      <p className="mt-3 text-base leading-7">{statusDetail(row.status, row.recordedSentAt, row.resultAmountMinor, row.resultCurrency)}</p>
      <div className="mt-4">
        <Notice error={query.error} notice={query.notice} />
      </div>

      <form action={`/api/cases/${id}`} method="post" className="mt-6 flex flex-col gap-4">
        <Field id="subject" label="Subject" error={query.error === "subject" ? "Check the subject." : null}>
          <input id="subject" name="subject" defaultValue={row.subject} maxLength={200} readOnly={locked} className={inputClass} />
        </Field>
        <Field id="body" label="Letter" error={query.error === "body" ? "Check the letter." : null}>
          <textarea id="body" name="body" defaultValue={row.body} rows={14} maxLength={8000} readOnly={locked} className={`${inputClass} min-h-72 py-3 leading-7`} />
        </Field>
        <fieldset className="flex flex-col gap-3">
          <legend className="font-semibold">Evidence you will handle</legend>
          {record.evidence.map((item) => (
            <label key={item.id} className="flex min-h-12 items-start gap-3 text-base leading-6">
              <input type="checkbox" name={`evidence_${item.id}`} value="yes" defaultChecked={item.checked} disabled={locked} className="mt-1 size-5" />
              <span>
                {item.label}
                {item.required ? <span className="text-muted"> Suggested.</span> : null}
              </span>
            </label>
          ))}
        </fieldset>
        {locked ? null : (
          <button className={buttonClass("primary", "xl")} type="submit">
            Save letter
          </button>
        )}
      </form>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <CopyLetter text={letter} />
        <a href={`/api/cases/${id}/export`} className={buttonClass("secondary")}>
          Download .txt
        </a>
      </div>

      {row.status === "draft" || row.status === "recorded_sent" ? (
        <div className="mt-8 grid gap-4">
          {row.status === "draft" ? (
            <form action={`/api/cases/${id}/status`} method="post" className="rounded-3xl border border-line bg-card px-5 py-4">
              <h2 className="text-lg font-semibold">I sent this myself</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Rewind does not email the store. Check the box only after you have sent the letter.</p>
              <input type="hidden" name="action" value="record_sent" />
              <label className="mt-3 flex min-h-12 items-start gap-3">
                <input type="checkbox" name="confirm" value="yes" className="mt-1 size-5" />
                <span>I sent this outside Rewind.</span>
              </label>
              <button className={`${buttonClass("primary")} mt-3`} type="submit">
                Record that I sent it
              </button>
            </form>
          ) : null}
          <form action={`/api/cases/${id}/status`} method="post" className="rounded-3xl border border-line bg-card px-5 py-4">
            <h2 className="text-lg font-semibold">I was refunded</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Enter only money you actually received. An estimate will not be saved as confirmed.</p>
            <input type="hidden" name="action" value="mark_won" />
            <Field id="amount" label="Amount received" error={query.error === "amount" ? "Check the amount." : null}>
              <input id="amount" name="amount" inputMode="decimal" placeholder="0.00" className={`${inputClass} amount`} />
            </Field>
            <label className="mt-3 flex min-h-12 items-start gap-3">
              <input type="checkbox" name="confirm" value="yes" className="mt-1 size-5" />
              <span>This is the amount I received, not an estimate.</span>
            </label>
            <button className={`${buttonClass("primary")} mt-3`} type="submit">
              Record the refund
            </button>
          </form>
          <form action={`/api/cases/${id}/status`} method="post" className="rounded-3xl border border-line bg-card px-5 py-4">
            <h2 className="text-lg font-semibold">The request was denied</h2>
            <input type="hidden" name="action" value="mark_denied" />
            <label className="mt-3 flex min-h-12 items-start gap-3">
              <input type="checkbox" name="confirm" value="yes" className="mt-1 size-5" />
              <span>The store denied this. Do not add it to confirmed savings.</span>
            </label>
            <button className={`${buttonClass("secondary")} mt-3`} type="submit">
              Record a denial
            </button>
          </form>
          <form action={`/api/cases/${id}/status`} method="post" className="rounded-3xl border border-line px-5 py-4">
            <input type="hidden" name="action" value="withdraw" />
            <label className="flex min-h-12 items-start gap-3">
              <input type="checkbox" name="confirm" value="yes" className="mt-1 size-5" />
              <span>Withdraw this case. It will not be marked as sent.</span>
            </label>
            <button className={`${buttonClass("ghost")} mt-3`} type="submit">
              Withdraw
            </button>
          </form>
        </div>
      ) : null}
    </main>
  );
}

function statusLabel(status: string) {
  if (status === "draft") return "Not sent";
  if (status === "recorded_sent") return "You recorded a send";
  if (status === "won") return "You confirmed a refund";
  if (status === "denied") return "You recorded a denial";
  if (status === "withdrawn") return "Withdrawn";
  return status;
}

function statusDetail(status: string, sentAt: string | null, amount: number | null, currency: string | null) {
  if (status === "draft") return "Rewind has not contacted anyone. This letter is a draft until you record a send.";
  if (status === "recorded_sent") {
    return `You recorded a send${sentAt ? ` on ${formatCalendarDate(sentAt.slice(0, 10))}` : ""}. Rewind did not send the letter.`;
  }
  if (status === "won" && amount != null && currency) return `You confirmed ${formatMinor(amount, currency)} received. That is the only amount counted as recovered.`;
  if (status === "denied") return "You recorded a denial. Confirmed savings did not change.";
  if (status === "withdrawn") return "You withdrew this case before it was marked as sent.";
  return "Check the status before you rely on it.";
}
