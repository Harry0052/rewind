import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { evaluatePolicy, type PolicyRule } from "@/lib/eligibility";
import type { RewindDb } from "@/lib/db/client";
import { cases, opportunities, policies, purchases } from "@/lib/db/schema";
import { nowIso } from "@/lib/time";
import { sumMinor } from "@/lib/money";

export function syncPurchaseOpportunities(db: RewindDb, purchaseId: string, now = new Date()) {
  const purchase = db.select().from(purchases).where(eq(purchases.id, purchaseId)).get();
  if (!purchase) return [];
  const active = db
    .select()
    .from(policies)
    .where(and(eq(policies.merchantKey, purchase.merchantKey), isNull(policies.supersededAt)))
    .all();
  const existing = db.select().from(opportunities).where(eq(opportunities.purchaseId, purchaseId)).all();
  const activeIds = new Set(active.map((policy) => policy.id));
  const timestamp = nowIso(now);

  db.transaction((tx) => {
    for (const row of existing) {
      if (!activeIds.has(row.policyId)) {
        const linked = tx.select().from(cases).where(eq(cases.opportunityId, row.id)).get();
        if (!linked) tx.delete(opportunities).where(eq(opportunities.id, row.id)).run();
      }
    }
    for (const policy of active) {
      const rule: PolicyRule = {
        merchantName: policy.merchantName,
        policyType: policy.policyType,
        windowDays: policy.windowDays,
        inclusive: policy.inclusive === 1,
        timezone: policy.timezone,
        currency: policy.currency,
        minAmountMinor: policy.minAmountMinor,
        sourceTitle: policy.sourceTitle,
        recordedAt: policy.recordedAt,
      };
      const evaluation = evaluatePolicy(
        rule,
        { boughtOn: purchase.boughtOn, totalAmountMinor: purchase.totalAmountMinor, currency: purchase.currency },
        now,
      );
      const current = existing.find((row) => row.policyId === policy.id);
      if (current) {
        const linked = tx.select().from(cases).where(eq(cases.opportunityId, current.id)).get();
        if (linked && (linked.status === "won" || linked.status === "denied" || linked.status === "withdrawn")) {
          continue;
        }
        tx.update(opportunities)
          .set({
            status: evaluation.status,
            deadline: evaluation.deadline,
            estimatedAmountMinor: evaluation.estimatedAmountMinor,
            currency: purchase.currency,
            explanation: evaluation.explanation,
            evaluatedAt: timestamp,
            type: policy.policyType,
          })
          .where(eq(opportunities.id, current.id))
          .run();
      } else {
        tx.insert(opportunities)
          .values({
            id: randomUUID(),
            purchaseId: purchase.id,
            policyId: policy.id,
            userId: purchase.userId,
            type: policy.policyType,
            status: evaluation.status,
            deadline: evaluation.deadline,
            estimatedAmountMinor: evaluation.estimatedAmountMinor,
            currency: purchase.currency,
            explanation: evaluation.explanation,
            evaluatedAt: timestamp,
          })
          .run();
      }
    }
  });

  return db.select().from(opportunities).where(eq(opportunities.purchaseId, purchaseId)).all();
}

export function listPurchaseOpportunities(db: RewindDb, purchaseId: string, now = new Date()) {
  return syncPurchaseOpportunities(db, purchaseId, now);
}

export function getOpportunity(db: RewindDb, id: string, userId: string | null, now = new Date()) {
  const row = db.select().from(opportunities).where(eq(opportunities.id, id)).get();
  if (!row) return null;
  const purchase = db.select().from(purchases).where(eq(purchases.id, row.purchaseId)).get();
  if (!purchase) return null;
  if (purchase.isDemo !== 1 && purchase.userId !== userId) return null;
  syncPurchaseOpportunities(db, purchase.id, now);
  const fresh = db.select().from(opportunities).where(eq(opportunities.id, id)).get();
  if (!fresh) return null;
  const policy = db.select().from(policies).where(eq(policies.id, fresh.policyId)).get();
  return { opportunity: fresh, purchase, policy: policy ?? null };
}

export function listOwnOpportunities(db: RewindDb, userId: string, now = new Date()) {
  const rows = db.select().from(purchases).where(and(eq(purchases.userId, userId), eq(purchases.isDemo, 0))).all();
  for (const purchase of rows) syncPurchaseOpportunities(db, purchase.id, now);
  return db.select().from(opportunities).where(eq(opportunities.userId, userId)).all();
}

export function openEstimatesByCurrency(rows: { status: string; currency: string; estimatedAmountMinor: number | null; userId?: string }[], userId?: string) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (userId && row.userId && row.userId !== userId) continue;
    if (row.status !== "eligible" || row.estimatedAmountMinor == null) continue;
    totals.set(row.currency, sumMinor([totals.get(row.currency) ?? 0, row.estimatedAmountMinor]));
  }
  return [...totals.entries()].map(([currency, amountMinor]) => ({ currency, amountMinor }));
}
