# Rewind status

Product name: **Rewind**. The build brief used the codename UNDO. The owner renamed it. Code, UI, and docs say Rewind.

The owner pre-approved Stages 0 through 6 and said not to stop between them. Each stage report is below. The newest stage is first.

Stack: Next.js, TypeScript strict, Tailwind, Drizzle, SQLite, Vitest, Playwright, GitHub Actions. SQLite matches Ripple, Bond, and Lumen so the app runs with no API key. PostgreSQL is not wired up.

## Stage 6 — Hardening, pilot plan, and release notes

```text
PRODUCT: Rewind (brief codename UNDO)
STAGE: 6
STATUS: PASS
USER-FACING WORKING FLOWS: The flows from Stages 2–5, plus local activity counts on Settings, a runbook, and an unrun pilot plan.
UI/UX: Screenshots refreshed for overview, add purchase, sample purchase, limits, and settings at 390px and 1440px. No compliance or production-ready claim in the UI.
DATA + SECURITY: Owner checks on purchases, cases, and receipt files. Origin checks and SQLite rate limits on writes. Path keys for files must match a generated id. Audit rows omit letter text and receipt notes. Metrics count purchases, prepared cases, and confirmed recoveries for that browser only.
TESTS: npm run lint pass; npm run typecheck pass; npm test pass (25); npm run build pass; npm run test:e2e pass (13, including screenshots). GitHub Actions run 44425761161 on main passed the same lint, typecheck, unit, build, and e2e list.
REAL INTEGRATIONS: none | SANDBOX: sample policies and sample ledger, labeled Sample | DISABLED: email ingestion, bank linking, OCR, merchant send, payments, chargebacks, hosted Postgres
FILES CHANGED: metrics, Settings counts, README, docs/RUNBOOK.md, docs/PILOT.md, docs/screenshots, STATUS.md
OPEN BUGS/RISKS: Guest sessions die with the cookie. Rate limits are per process. Receipt files are not malware-scanned. Sample policy dates refresh on open. The GitHub Actions runner warned that actions/checkout and actions/setup-node still target Node.js 20.
NEXT STAGE PROPOSAL: None in this brief. A later change would add real, sourced merchant policies only with a recorded URL and date.
AWAITING APPROVAL: YES
```

The pilot in `docs/PILOT.md` has not been run. Rewind is not claimed to be production-ready or certified.

## Stage 5 — Trust and data controls

```text
PRODUCT: Rewind (brief codename UNDO)
STAGE: 5
STATUS: PASS
USER-FACING WORKING FLOWS: Attach a PDF or image to your own purchase. Download it. Another browser gets 404. A text file is rejected and the purchase stays. Download JSON. Type DELETE to remove this browser’s data. Confirmed savings stay separate from estimates.
UI/UX: Purchase page explains that files are not scanned. Settings explains download and delete. Overview shows both figures.
DATA + SECURITY: Files live under data/uploads outside public/. Download checks user id. Storage keys are generated ids. Export is the owner’s rows. Delete removes purchases, cases, files, and the session.
TESTS: src/lib/receipts/files.test.ts and src/lib/account/account.test.ts pass. e2e/privacy.spec.ts pass.
REAL INTEGRATIONS: local file storage | SANDBOX: none for files | DISABLED: malware scanning, OCR
FILES CHANGED: receipt file columns, upload and download routes, account export and delete, privacy e2e
OPEN BUGS/RISKS: No virus scanner. A cleared cookie cannot download an old file because the session is the owner key.
NEXT STAGE PROPOSAL: Stage 6 audit notes, counts, runbook, pilot, screenshots.
AWAITING APPROVAL: YES
```

## Stage 4 — Case preparation

```text
PRODUCT: Rewind (brief codename UNDO)
STAGE: 4
STATUS: PASS
USER-FACING WORKING FLOWS: From an eligible window, prepare a letter, edit it, copy or download it, and record a send only after checking the box. Record a refund amount or a denial. The case stays “Not sent” until that record. A second prepare opens the same case.
UI/UX: Case workspace with checklist, copy, download, and separate confirmations for send, refund, and denial. Cases in the primary nav.
DATA + SECURITY: One case per opportunity. Another browser gets 404. Terminal outcomes are not rewritten. A won case closes that opportunity so its estimate leaves the open total. The confirmed amount is the amount typed, capped at the purchase total.
TESTS: src/lib/cases/cases.test.ts pass. e2e/cases.spec.ts pass.
REAL INTEGRATIONS: none | SANDBOX: none | DISABLED: emailing the store
FILES CHANGED: cases table, letter builder, case pages and routes
OPEN BUGS/RISKS: Copy uses the browser clipboard and says so when it fails. The letter remains selectable.
NEXT STAGE PROPOSAL: Stage 5 private files, export, and delete.
AWAITING APPROVAL: YES
```

## Stage 3 — Policy-backed opportunities

```text
PRODUCT: Rewind (brief codename UNDO)
STAGE: 3
STATUS: PASS
USER-FACING WORKING FLOWS: A purchase whose store matches a stored policy shows an open, closed, or outside-conditions explanation, the last day, and the policy source. A store with no policy says Rewind will not guess. Price adjustments have no dollar estimate.
UI/UX: Opportunity cards on the purchase and a detail page. Overview splits “Estimated, still open” from “Recorded as received.”
DATA + SECURITY: Opportunities belong to the purchase owner. Sample opportunities are readable and labeled. A newer policy version supersedes the old window. Evaluations recompute from the clock in the policy timezone.
TESTS: src/lib/eligibility.test.ts covers the New York midnight boundary, inclusive and exclusive windows, and a below-minimum purchase. src/lib/opportunities/opportunities.test.ts pass. e2e/opportunities.spec.ts pass.
REAL INTEGRATIONS: none | SANDBOX: fictional sample policies | DISABLED: live policy crawling
FILES CHANGED: opportunities table, eligibility rules, opportunity UI
OPEN BUGS/RISKS: A real store name will not match the sample registry. That is intentional.
NEXT STAGE PROPOSAL: Stage 4 letters and outcomes.
AWAITING APPROVAL: YES
```

## Stage 2 — Purchase ledger

```text
PRODUCT: Rewind (brief codename UNDO)
STAGE: 2
STATUS: PASS
USER-FACING WORKING FLOWS: Add a purchase with line items, see the cent total, refresh, edit the lines, and delete. A bad price does not create a row. Another browser cannot open the purchase. Sample purchases are visible and not editable.
UI/UX: Purchases list, add form, detail, and edit. Mobile and desktop overflow checks in Playwright. A live total is labeled as a preview; the server sum is what is stored.
DATA + SECURITY: purchases, items, and optional typed receipt notes. Owner filter on every read and write. Origin check and rate limit on writes.
TESTS: src/lib/purchases/purchases.test.ts and src/lib/money.test.ts pass. e2e/purchases.spec.ts pass. 86.00 plus two 12.50 lines stores 11100 minor units.
REAL INTEGRATIONS: none | SANDBOX: sample ledger | DISABLED: file upload at this stage (added in Stage 5)
FILES CHANGED: purchase migration, services, forms, list and detail pages
OPEN BUGS/RISKS: None open in the ledger tests.
NEXT STAGE PROPOSAL: Stage 3 deadlines.
AWAITING APPROVAL: YES
```

## Stage 1 — Foundation

```text
PRODUCT: Rewind (brief codename UNDO)
STAGE: 1
STATUS: PASS
USER-FACING WORKING FLOWS: Overview reads sample policies from SQLite. Each policy page opens. Settings save a name and timezone for this browser. Limits lists integrations that are off. Unknown URLs are a real 404.
UI/UX: Paper #F6F7F7, ink #16212A, lime #B6ED72. Source Sans 3 and Fraunces. Skip link, focus ring, mobile nav, desktop nav. Contrast tests for ink on paper and ink on lime. A root loading.tsx was removed so notFound can return HTTP 404 instead of a streamed 200.
DATA + SECURITY: users, sessions, audit, rate buckets, policies. Cookie rewind_session stores a hash only.
TESTS: lint, typecheck, unit smoke tests, production build, and e2e/foundation.spec.ts pass.
REAL INTEGRATIONS: none | SANDBOX: sample policy copy | DISABLED: the Limits list
FILES CHANGED: app scaffold, design system, policy registry, settings
OPEN BUGS/RISKS: None left from the foundation checks.
NEXT STAGE PROPOSAL: Stage 2 ledger.
AWAITING APPROVAL: YES
```

## Stage 0 — Inspect and design

```text
PRODUCT: Rewind (brief codename UNDO)
STAGE: 0
STATUS: PASS
USER-FACING WORKING FLOWS: None. The repository started as a one-line README.
UI/UX: No screens. The mobile flow was specified before coding.
DATA + SECURITY: No database and no secrets.
TESTS: not run — there was no app.
REAL INTEGRATIONS: none | SANDBOX: none | DISABLED: email, bank, OCR, merchant send, payments, chargebacks
FILES CHANGED: STATUS.md
OPEN BUGS/RISKS: Sample policies can be mistaken for real stores; deadlines can be off by a day; money can be rounded; receipt files are untrusted; guest sessions are browser-local.
NEXT STAGE PROPOSAL: Stage 1 foundation.
AWAITING APPROVAL: YES
```

The owner’s request pre-approved every stage, so work continued after each report.
