# Rewind runbook

This describes how to run the local app and how to roll back its SQLite file. It is not a production certification, and it is not a compliance claim.

## Requirements

- Node.js 22 or newer
- No API keys
- A writable `data/` directory

## First run

```bash
npm install
npm run db:setup
npm run dev
```

`npm run db:setup` runs `src/lib/db/setup.ts`, which opens `REWIND_DB_PATH` (default `data/rewind.db`), applies every SQL file in `drizzle/migrations` once, and seeds the sample policies and sample purchases if they are missing.

A production-style local process:

```bash
npm run db:setup
npm run build
npm run start
```

## Environment

| Name | Required | Purpose |
| --- | --- | --- |
| `REWIND_DB_PATH` | No | SQLite file. Default `data/rewind.db`. |

Rewind does not read a merchant, mail, bank, OCR, or payment key. Setting one does not turn a feature on.

## Migrations

Migrations are ordered SQL files. The runner records the file name in `schema_migrations` and skips names it has already applied. It does not roll a file back by itself.

To add a migration, add a new `drizzle/migrations/0007_something.sql`. Do not edit a file that has already been applied to a database you care about.

## Rollback

The local database is one file (plus `-wal` and `-shm` while the process is running). Receipt files, if any, live under `data/uploads/`.

1. Stop the Node process so SQLite can checkpoint.
2. Copy `data/rewind.db` (and the `-wal` / `-shm` files if they exist) and `data/uploads/` to a dated backup before a migration.
3. To roll back, stop the process, replace the file and the uploads directory with the backup, and start again.
4. Do not delete `schema_migrations` rows by hand unless you also restore the matching file.

Sample policy text and sample purchase dates live in the database after seed. Restoring an older file restores older sample rows too. Sample purchase dates are refreshed when the database opens so the sample windows stay visible. They stay labeled Sample.

## Incident notes

- A person can delete only the session in their browser, from Settings. Sample policies and the sample ledger are not deleted.
- Session tokens are stored as SHA-256 hashes. The audit table stores event names and short metadata. It does not store letter text, receipt notes, or tokens.
- Receipt files are stored outside `public/` and are downloaded only after an owner check. They are not scanned. Treat them as untrusted.
- Logs from `logFailure` include a scope, a code, and a short detail. They are not a metrics product. The counts in Settings are rows in this database for that browser.
- There is no email, bank, or merchant-send path. An incident does not page anyone from this app.
- Rate limits are rows in SQLite for this process. They are not a shared cluster limit.

## What this runbook does not claim

Hosting, backups, access control, and monitoring for a public server are not set up here. CI runs lint, typecheck, unit tests, the production build, and Playwright against a fresh SQLite file. That is the checked path. It is not a launch approval.
