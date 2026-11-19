import { randomUUID } from "node:crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import { recordEvent } from "@/lib/audit";
import type { RewindDb } from "@/lib/db/client";
import { cases, items, opportunities, purchases, receipts, users } from "@/lib/db/schema";
import { recordMetric } from "@/lib/metrics";
import { syncPurchaseOpportunities } from "@/lib/opportunities/opportunities";
import { merchantKey } from "@/lib/policies/samples";
import { nowIso } from "@/lib/time";
import type { PurchaseDraft } from "@/lib/validators/purchase";

export const DEMO_USER_ID = "00000000-0000-4000-8000-0000000000d1";

export function ensureDemoUser(db: RewindDb) {
  const row = db.select().from(users).where(eq(users.id, DEMO_USER_ID)).get();
  if (row) return;
  db.insert(users)
    .values({
      id: DEMO_USER_ID,
      displayName: "Sample shopper",
      kind: "demo",
      timezone: "America/New_York",
      createdAt: "2026-11-18T00:00:00.000Z",
    })
    .run();
}

export type PurchaseRecord = {
  purchase: typeof purchases.$inferSelect;
  items: (typeof items.$inferSelect)[];
  note: string | null;
};

export function listOwnPurchases(db: RewindDb, userId: string) {
  return db
    .select()
    .from(purchases)
    .where(and(eq(purchases.userId, userId), eq(purchases.isDemo, 0)))
    .orderBy(desc(purchases.boughtOn), desc(purchases.createdAt))
    .all();
}

export function listSamplePurchases(db: RewindDb) {
  return db.select().from(purchases).where(eq(purchases.isDemo, 1)).orderBy(desc(purchases.boughtOn)).all();
}

export function getPurchase(db: RewindDb, id: string, userId: string | null): PurchaseRecord | null {
  const purchase = db.select().from(purchases).where(eq(purchases.id, id)).get();
  if (!purchase) return null;
  if (purchase.isDemo !== 1 && purchase.userId !== userId) return null;
  const rows = db.select().from(items).where(eq(items.purchaseId, id)).orderBy(asc(items.position)).all();
  const noteRow = db
    .select()
    .from(receipts)
    .where(and(eq(receipts.purchaseId, id), eq(receipts.kind, "note")))
    .get();
  return { purchase, items: rows, note: noteRow?.note ?? null };
}

export function createPurchase(db: RewindDb, userId: string, draft: PurchaseDraft) {
  const id = randomUUID();
  const timestamp = nowIso();
  db.transaction((tx) => {
    tx.insert(purchases)
      .values({
        id,
        userId,
        merchantName: draft.merchantName,
        merchantKey: merchantKey(draft.merchantName),
        boughtOn: draft.boughtOn,
        currency: draft.currency,
        totalAmountMinor: draft.totalAmountMinor,
        note: draft.note || null,
        isDemo: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .run();
    writeItems(tx, id, draft);
    writeNote(tx, id, userId, draft.note, timestamp);
  });
  recordEvent(db, userId, "purchase_created", { purchaseId: id, totalAmountMinor: draft.totalAmountMinor, currency: draft.currency });
  recordMetric(db, userId, "purchase_added");
  syncPurchaseOpportunities(db, id);
  return id;
}

export function updatePurchase(db: RewindDb, userId: string, id: string, draft: PurchaseDraft) {
  const existing = db.select().from(purchases).where(eq(purchases.id, id)).get();
  if (!existing || existing.userId !== userId || existing.isDemo === 1) {
    return { ok: false as const, code: existing?.isDemo === 1 ? "sample" : "not_found", message: existing?.isDemo === 1 ? "Sample purchases cannot be edited." : "That purchase is not in this browser." };
  }
  const timestamp = nowIso();
  db.transaction((tx) => {
    tx.update(purchases)
      .set({
        merchantName: draft.merchantName,
        merchantKey: merchantKey(draft.merchantName),
        boughtOn: draft.boughtOn,
        currency: draft.currency,
        totalAmountMinor: draft.totalAmountMinor,
        note: draft.note || null,
        updatedAt: timestamp,
      })
      .where(and(eq(purchases.id, id), eq(purchases.userId, userId)))
      .run();
    tx.delete(items).where(eq(items.purchaseId, id)).run();
    writeItems(tx, id, draft);
    tx.delete(receipts).where(and(eq(receipts.purchaseId, id), eq(receipts.kind, "note"))).run();
    writeNote(tx, id, userId, draft.note, timestamp);
  });
  recordEvent(db, userId, "purchase_updated", { purchaseId: id, totalAmountMinor: draft.totalAmountMinor, currency: draft.currency });
  syncPurchaseOpportunities(db, id);
  return { ok: true as const, id };
}

export function deletePurchase(db: RewindDb, userId: string, id: string) {
  const existing = db.select().from(purchases).where(eq(purchases.id, id)).get();
  if (!existing || existing.userId !== userId || existing.isDemo === 1) {
    return {
      ok: false as const,
      code: existing?.isDemo === 1 ? "sample" : "not_found",
      message: existing?.isDemo === 1 ? "Sample purchases cannot be deleted." : "That purchase is not in this browser.",
    };
  }
  db.transaction((tx) => {
    const linked = tx.select().from(opportunities).where(eq(opportunities.purchaseId, id)).all();
    for (const row of linked) tx.delete(cases).where(eq(cases.opportunityId, row.id)).run();
    tx.delete(opportunities).where(eq(opportunities.purchaseId, id)).run();
    tx.delete(receipts).where(eq(receipts.purchaseId, id)).run();
    tx.delete(items).where(eq(items.purchaseId, id)).run();
    tx.delete(purchases).where(and(eq(purchases.id, id), eq(purchases.userId, userId))).run();
  });
  recordEvent(db, userId, "purchase_deleted", { purchaseId: id });
  return { ok: true as const };
}

type Writer = Pick<RewindDb, "insert" | "delete">;

function writeItems(tx: Writer, purchaseId: string, draft: PurchaseDraft) {
  draft.items.forEach((item, position) => {
    tx.insert(items)
      .values({
        id: randomUUID(),
        purchaseId,
        description: item.description,
        quantity: item.quantity,
        unitPriceMinor: item.unitPriceMinor,
        lineTotalMinor: item.lineTotalMinor,
        position,
      })
      .run();
  });
}

function writeNote(tx: Writer, purchaseId: string, userId: string, note: string, timestamp: string) {
  if (!note) return;
  tx.insert(receipts)
    .values({
      id: randomUUID(),
      purchaseId,
      userId,
      kind: "note",
      extractionStatus: "user_entered",
      note,
      createdAt: timestamp,
    })
    .run();
}
