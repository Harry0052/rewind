import { databasePath, getSqlite } from "./client";

getSqlite();
console.log(`Rewind database is migrated at ${databasePath()}`);
