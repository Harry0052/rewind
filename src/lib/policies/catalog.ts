import { and, asc, eq, isNull } from "drizzle-orm";
import type { RewindDb } from "@/lib/db/client";
import { policies } from "@/lib/db/schema";
import { merchantKey } from "./samples";

export function listActivePolicies(db: RewindDb) {
  return db.select().from(policies).where(isNull(policies.supersededAt)).orderBy(asc(policies.merchantName), asc(policies.policyType)).all();
}

export function getPolicyBySlug(db: RewindDb, slug: string) {
  return db.select().from(policies).where(eq(policies.slug, slug)).get() ?? null;
}

export function activePoliciesForMerchant(db: RewindDb, name: string) {
  return db
    .select()
    .from(policies)
    .where(and(eq(policies.merchantKey, merchantKey(name)), isNull(policies.supersededAt)))
    .all();
}
