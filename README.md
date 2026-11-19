# Rewind

Rewind keeps a purchase you type from a receipt, calculates a deadline from a policy stored in the app, and helps you prepare a letter. You send the letter yourself and record what the store did. Only an amount you confirm is counted as recovered.

The working codename in the original brief was UNDO. The product name is Rewind.

## Quickstart

Node.js 22 or newer. No API key.

```bash
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run db:setup` creates `data/rewind.db` and applies the SQL in `drizzle/migrations`. The database path is `REWIND_DB_PATH` (see `.env.example`).

A production-style local process:

```bash
npm run db:setup
npm run build
npm run start
```

## Architecture

- Next.js App Router and React, TypeScript strict, Tailwind CSS.
- SQLite through `better-sqlite3` and Drizzle. This matches the owner’s sibling apps (Ripple, Bond, and Lumen), so Rewind runs locally without a hosted database. PostgreSQL is not wired up.
- Server routes under `src/app/api` call services in `src/lib`. Pages read those services directly.
- A browser session is a random token stored only as a SHA-256 hash. The cookie is `rewind_session`, `httpOnly`, `SameSite=Lax`, and `Secure` only on HTTPS.
- Money is integer minor units. Totals are the sum of line totals. Deadlines use the policy’s IANA timezone and a calendar date.
- Personal rows are filtered by `user_id`. A missing or someone else’s id is a not-found page. Sample rows are labeled Sample and are not writable.
- Mutations check the `Origin` header. Writes are rate-limited in SQLite.
- Cache Components are off so one person’s purchases are not placed in a shared cache. There is no root loading boundary, so a missing record can still answer 404.

```text
src/app            routes and pages
src/components     shell, ledger, and design-system pieces
src/lib/db         schema, migrations, sample seed
src/lib/auth       sessions
src/lib/purchases  ledger
src/lib/eligibility  deadline rules
src/lib/cases      letters and outcomes
src/lib/receipts   private files
src/lib/account    export and deletion
```

## What is real, sandboxed, or disabled

| Capability | State |
| --- | --- |
| Sample policies for Harbor & Co., Northline Goods, and Fieldnote Supply | Real rows, labeled Sample. The merchants are fictional. The source page is inside this app. |
| Sample purchases | Real rows, labeled Sample, read-only. Dates refresh when the database opens so the sample windows stay visible. |
| Add, edit, and delete your own purchase | Real. The total is the sum of the lines in cents. |
| Eligibility, deadline, and “outside the conditions” | Real calculation from the stored policy. Not a promise the store will pay. |
| Editable letter, checklist, copy, and `.txt` download | Real. Rewind does not send the letter. |
| Record a send, a refund, or a denial | Real, and only after you confirm. Confirmed savings are the amounts on won cases. Estimates are not added. |
| Receipt file upload | Real for PDF, PNG, JPEG, and WEBP under 5 MB. Stored outside the public folder. Owner-only download. Labeled not scanned. Text is not extracted. |
| Download JSON and delete this browser’s data | Real. Sample policies stay. |
| Activity counts in Settings | Real rows in this database for this browser. Not a published statistic. |
| Email receipt ingestion, bank linking, OCR, sending mail to a store, fees, chargebacks | Disabled. The Limits page says Off. |
| Hosted Postgres | Not in this repo. Not verified in CI. |

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

GitHub Actions runs the same list on pushes to `main`. Playwright deletes and recreates `data/rewind-e2e.db` for that run.

Screenshots of the main screens are in `docs/screenshots`. Deployment and rollback notes are in `docs/RUNBOOK.md`. The unrun pilot plan is in `docs/PILOT.md`.

This repository does not claim a compliance certification or that the app is ready for a public launch.
