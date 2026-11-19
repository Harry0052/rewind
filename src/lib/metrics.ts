import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { RewindDb } from "@/lib/db/client";
import { metricEvents } from "@/lib/db/schema";
import { nowIso } from "@/lib/time";

export function recordMetric(db: RewindDb, userId: string | null, kind: string) {
  db.insert(metricEvents)
    .values({ id: randomUUID(), userId, kind, createdAt: nowIso() })
    .run();
}

export function countMetrics(db: RewindDb, userId: string) {
  const rows = db.select().from(metricEvents).where(eq(metricEvents.userId, userId)).all();
  const count = (kind: string) => rows.filter((row) => row.kind === kind).length;
  const purchases = count("purchase_added");
  const prepared = count("case_prepared");
  const recovered = count("recovery_confirmed");
  return {
    purchases,
    prepared,
    recovered,
    perHundred: purchases === 0 ? null : Math.floor((prepared * 100) / purchases),
  };
}

export function countKind(db: RewindDb, userId: string, kind: string) {
  return db
    .select()
    .from(metricEvents)
    .where(and(eq(metricEvents.userId, userId), eq(metricEvents.kind, kind)))
    .all().length;
}
