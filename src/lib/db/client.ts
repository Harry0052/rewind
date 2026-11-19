import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { migrate } from "./migrate";
import { seedDemo } from "./seed";

export type RewindDb = BetterSQLite3Database<typeof schema>;

const globalForDb = globalThis as unknown as { rewindSqlite?: Database.Database };

export function databasePath() {
  return process.env.REWIND_DB_PATH ?? path.join(process.cwd(), "data", "rewind.db");
}

export function openDatabase(filename: string) {
  if (filename !== ":memory:") {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
  }
  const sqlite = new Database(filename);
  sqlite.pragma("foreign_keys = ON");
  if (filename !== ":memory:") {
    sqlite.pragma("journal_mode = WAL");
  }
  sqlite.pragma("busy_timeout = 3000");
  migrate(sqlite);
  return sqlite;
}

export function getSqlite() {
  if (!globalForDb.rewindSqlite) {
    const sqlite = openDatabase(databasePath());
    seedDemo(drizzle(sqlite, { schema }));
    globalForDb.rewindSqlite = sqlite;
  }
  return globalForDb.rewindSqlite;
}

export function getDb() {
  return drizzle(getSqlite(), { schema });
}

export function databaseFrom(sqlite: Database.Database): RewindDb {
  return drizzle(sqlite, { schema });
}

export function createTestDb() {
  return databaseFrom(openDatabase(":memory:"));
}
