# Rewind status

Product name: **Rewind**. The build brief used the codename UNDO. The owner renamed it. Code, UI, and docs say Rewind.

This file is the stage log. The newest stage is first.

## Stage 0 — Inspect and design

```text
PRODUCT: Rewind (brief codename UNDO)
STAGE: 0
STATUS: PASS
USER-FACING WORKING FLOWS: None yet. The repository had a one-line README and no application.
UI/UX: No screens. Mobile flow is specified below and is not built.
DATA + SECURITY: No database, no session, no secrets in the repo.
TESTS: not run — there is no app yet.
REAL INTEGRATIONS: none configured | SANDBOX: none yet | DISABLED: email receipt ingestion, bank linking, OCR, merchant submission, payments, chargebacks
FILES CHANGED: STATUS.md
OPEN BUGS/RISKS: See risks below. Nothing is implemented, so nothing is faked.
NEXT STAGE PROPOSAL: Stage 1 foundation — strict Next.js app, SQLite migrations, design tokens, shell, and one screen that reads the sample policy registry from the database.
AWAITING APPROVAL: YES
```

The owner’s build request pre-approved Stages 0 through 6 and said not to stop between them. Stage 1 starts after this commit. Later stage reports stay in this file.

### Repository

- Remote: `Harry0052/rewind`, private, branch `main`.
- Starting tree: `README.md` with the title only, plus the initial commit. No app, no CI, no database.
- Sibling apps inspected: Ripple, Bond, and Lumen. They are Next.js App Router, TypeScript strict, Tailwind 4, Drizzle, `better-sqlite3`, Vitest, Playwright, and a GitHub Actions workflow that runs lint, typecheck, unit tests, build, and e2e.

### Stack decision

The brief suggests PostgreSQL. Rewind uses SQLite, matching Ripple, Bond, and Lumen, so `npm install`, `npm run db:setup`, and `npm run dev` work with no API key and no hosted database. PostgreSQL is not wired up and is not claimed.

Sessions match the siblings: a random token in an `httpOnly` cookie, stored only as a SHA-256 hash. The cookie name will be `rewind_session`.

### Product scope for the first working slice

The job: a person adds a purchase from a receipt they have, sees a deadline calculated from a policy Rewind actually has on file, prepares a letter, sends it themselves, and records what the store did.

By the end of Stage 2 the first real action is: add a purchase, refresh, and see the same line items and the same cent-accurate total.

By the end of Stage 4 the aha moment works: eligibility window, a case the user edits, and a won or denied result only after the user records it.

### What is not available

| Integration | Decision |
| --- | --- |
| Merchant policy crawler | Not built. Policies are rows Rewind stores, with a source and a recorded date. The seed set is labeled sample and points at in-app pages. No live merchant site is scraped. |
| OCR / receipt parsing | Not built. A typed note is `user_entered`. A file upload, when it exists, is stored and labeled not scanned. |
| Email receipt ingestion (OAuth) | Disabled. No mail provider. |
| Bank linking | Disabled. Not required. |
| Sending the request to a merchant | Disabled. The user copies or downloads the letter and records the send. |
| Payments, subscriptions, success fees | Disabled. Nothing is billed. |
| Chargebacks | Out of scope. No chargeback flow. |

### Primary mobile flow

1. Overview — next action is obvious: add a purchase, or open a sample that is labeled sample.
2. Add purchase — merchant, date, currency, line items. Total is the sum of the lines in minor units.
3. Purchase — seller, date, items, total, and later the policy deadlines.
4. Opportunity — why it is eligible, expired, or outside the stored conditions, plus the deadline.
5. Case — editable letter, checklist, copy or download. Status stays unsent until the user records a send.
6. Outcome — the user enters a refunded amount or a denial. Only a confirmed amount counts as recovered.
7. Settings — name, timezone, export, delete, and a list of what is disabled.

Happy path: steps 2 through 6 on the user’s own purchase, then the overview shows that confirmed amount.

Failure and permission paths:

- Invalid money, date, or empty merchant stays on the form with the field error. Nothing is saved as success.
- A second browser session does not see the first person’s purchases, receipts, or cases. Unknown ids look like a missing page.
- Sample rows are readable and labeled Sample. Writes to them are refused.
- No matching policy: the purchase is saved, and the screen says Rewind will not guess a window.
- Expired or outside the stored conditions: not labeled eligible, and Rewind does not offer to prepare that request.
- Network or server failure: the page says the save did not happen. The user can retry.

### Component map

- Shell: header, primary nav, mobile bar, footer, skip link, 404, error boundary.
- UI: button, field, badge, notice, skeleton.
- Product: receipt card, purchase form, opportunity summary, case letter, savings figures.
- One screen in Stage 1: Overview listing the sample policy registry from SQLite, with links that open those policies. Purchases and cases are not stubbed as dead buttons.

### Domain model for Stage 2

Stage 2 persists only the ledger:

- `users`, `sessions` — guest browser session.
- `purchases` — owner, merchant name, purchase date, currency, total in minor units, demo flag.
- `items` — description, quantity, unit price in minor units, line total.
- `receipts` — optional note the user typed. Extraction status `user_entered`. No file yet.

Money is integer minor units. Totals are the sum of line totals. Floating point is not used to add money.

Stage 3 adds versioned `policies` and `opportunities`. Stage 4 adds `cases`. Stage 5 adds receipt files, export, and deletion. The Stage 1 database can hold the policy registry early because the Overview reads it. Later tables arrive in later migrations.

### Security boundary

- Personal rows are filtered by `user_id` on every read and write.
- Sample rows use a demo user with no session. They are world-readable and not writable.
- Mutations check the `Origin` header against the host.
- Write routes are rate-limited in SQLite.
- Audit rows store an event name and short metadata. They do not store letter text, receipt notes, or tokens.
- Uploaded files, once added, live outside `public/` and are downloaded only through an owner check.
- No secrets in the repo. `.env.example` names the database path only.

### Build and test plan

1. Stage 1 — scaffold, tokens, shell, policy overview, unit smoke test, lint, typecheck, build, e2e, screenshots at 390 and 1440.
2. Stage 2 — create, list, edit purchases. Tests for several purchases, cent totals, and refresh.
3. Stage 3 — policy windows, merchant timezone, inclusive versus exclusive deadlines, outside-conditions wording.
4. Stage 4 — letter, checklist, export, status machine. A case is not “sent” until the user says so.
5. Stage 5 — private file upload, export, delete, confirmed savings separated from estimates.
6. Stage 6 — authorization tests, runbook, pilot plan, CI, screenshots. No compliance claim.

### Risks

1. A sample policy can be mistaken for a real store rule. Mitigation: fictional merchant names, a Sample label, and an in-app source page that says it is not a live policy.
2. Deadline off-by-one across timezones. Mitigation: calendar dates plus the policy timezone, with unit tests at the New York midnight boundary.
3. Money rounding. Mitigation: parse decimal strings into integer minor units and add integers only.
4. Receipt files are untrusted. Mitigation: size cap, allow-listed types, generated storage keys, owner-only download, and a visible “not scanned” label. There is no malware scanner in this app.
5. Guest sessions are browser-local. A cleared cookie loses the handle to that data. Export and delete are in Stage 5. This is not an account system with email recovery.

### Stage 1 checklist

- Next.js, TypeScript strict, Tailwind, ESLint, Vitest, Playwright, GitHub Actions, `.env.example`.
- Migration runner and `npm run db:setup`.
- Tokens: paper `#F6F7F7`, ink `#16212A`, lime `#B6ED72`. Source Sans 3 and Fraunces.
- Shell with keyboard focus, skip link, mobile nav, 404, and error boundary.
- Overview reads sample policies from SQLite. Every primary control opens a real policy or settings page.
- Settings can save a display name and timezone, or the screen explains why it cannot.
- Disabled integrations are listed in words, with no pretend connect button.
- Lint, typecheck, unit test, production build, and a Playwright smoke test.
