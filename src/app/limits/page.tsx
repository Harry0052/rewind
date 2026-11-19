import type { Metadata } from "next";
import { flags } from "@/lib/flags";

export const metadata: Metadata = { title: "Limits" };

const ROWS = [
  { flag: flags.emailIngestion, title: "Email receipt ingestion", detail: "No mail account is connected. There is no OAuth button." },
  { flag: flags.ocr, title: "Reading a receipt photo", detail: "Rewind does not extract text from a file. You type the purchase yourself." },
  { flag: flags.bankLinking, title: "Bank linking", detail: "No bank account is requested or connected." },
  { flag: flags.merchantSubmission, title: "Sending a request", detail: "Rewind does not email or message a store. You send a letter yourself, then you can record that you did." },
  { flag: flags.payments, title: "Fees and subscriptions", detail: "Nothing is billed in this version." },
  { flag: flags.chargebacks, title: "Chargebacks", detail: "There is no dispute or chargeback flow." },
  { flag: flags.hostedDatabase, title: "Hosted database", detail: "Purchases stay in a SQLite file on this machine. PostgreSQL is not set up." },
] as const;

export default function LimitsPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <p className="text-sm font-semibold tracking-[0.14em] text-muted uppercase">Disabled</p>
      <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">What Rewind cannot do</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        If a service is not connected, Rewind says so. It does not fill the gap with a made-up result.
      </p>
      <ul className="mt-8 flex flex-col gap-3">
        {ROWS.map((row) => (
          <li key={row.title} className="rounded-3xl border border-line bg-card px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{row.title}</h2>
              <span className="rounded-full bg-sand px-3 py-1 text-sm font-semibold">{row.flag ? "On" : "Off"}</span>
            </div>
            <p className="mt-2 text-base leading-7 text-muted">{row.detail}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
