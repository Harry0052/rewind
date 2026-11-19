import { eq } from "drizzle-orm";
import { recordEvent } from "@/lib/audit";
import type { RewindDb } from "@/lib/db/client";
import { cases, items, metricEvents, opportunities, purchases, receipts, securityEvents, sessions, users } from "@/lib/db/schema";
import { recoveredByCurrency } from "@/lib/cases/cases";
import { removeStoredFiles } from "@/lib/receipts/files";

export function exportAccount(db: RewindDb, userId: string) {
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user || user.kind === "deleted") return null;
  const ownPurchases = db.select().from(purchases).where(eq(purchases.userId, userId)).all();
  const ownItems = ownPurchases.flatMap((purchase) => db.select().from(items).where(eq(items.purchaseId, purchase.id)).all());
  const ownReceipts = db.select().from(receipts).where(eq(receipts.userId, userId)).all();
  const ownOpportunities = db.select().from(opportunities).where(eq(opportunities.userId, userId)).all();
  const ownCases = db.select().from(cases).where(eq(cases.userId, userId)).all();
  return {
    exportedAt: new Date().toISOString(),
    note: "This file is your Rewind data from this server. Confirmed savings are only cases you marked as received.",
    profile: { displayName: user.displayName, timezone: user.timezone },
    purchases: ownPurchases.map((purchase) => ({
      id: purchase.id,
      merchantName: purchase.merchantName,
      boughtOn: purchase.boughtOn,
      currency: purchase.currency,
      totalAmountMinor: purchase.totalAmountMinor,
      note: purchase.note,
    })),
    items: ownItems.map((item) => ({
      purchaseId: item.purchaseId,
      description: item.description,
      quantity: item.quantity,
      unitPriceMinor: item.unitPriceMinor,
      lineTotalMinor: item.lineTotalMinor,
    })),
    receipts: ownReceipts.map((receipt) => ({
      id: receipt.id,
      purchaseId: receipt.purchaseId,
      kind: receipt.kind,
      extractionStatus: receipt.extractionStatus,
      originalName: receipt.originalName,
      byteSize: receipt.byteSize,
    })),
    opportunities: ownOpportunities.map((row) => ({
      id: row.id,
      purchaseId: row.purchaseId,
      type: row.type,
      status: row.status,
      deadline: row.deadline,
      estimatedAmountMinor: row.estimatedAmountMinor,
      currency: row.currency,
    })),
    cases: ownCases.map((row) => ({
      id: row.id,
      status: row.status,
      subject: row.subject,
      body: row.body,
      resultAmountMinor: row.resultAmountMinor,
      resultCurrency: row.resultCurrency,
    })),
    confirmedSavings: recoveredByCurrency(ownCases),
  };
}

export function deleteAccount(db: RewindDb, userId: string) {
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user || user.kind === "deleted" || user.kind === "demo") {
    return { ok: false as const, code: "forbidden" as const, message: "That session is not on this server." };
  }
  const ownReceipts = db.select().from(receipts).where(eq(receipts.userId, userId)).all();
  const ownPurchases = db.select().from(purchases).where(eq(purchases.userId, userId)).all();
  db.transaction((tx) => {
    const ownCases = tx.select().from(cases).where(eq(cases.userId, userId)).all();
    for (const row of ownCases) tx.delete(cases).where(eq(cases.id, row.id)).run();
    const ownOpps = tx.select().from(opportunities).where(eq(opportunities.userId, userId)).all();
    for (const row of ownOpps) tx.delete(opportunities).where(eq(opportunities.id, row.id)).run();
    for (const row of ownReceipts) tx.delete(receipts).where(eq(receipts.id, row.id)).run();
    for (const purchase of ownPurchases) {
      tx.delete(items).where(eq(items.purchaseId, purchase.id)).run();
      tx.delete(purchases).where(eq(purchases.id, purchase.id)).run();
    }
    tx.delete(metricEvents).where(eq(metricEvents.userId, userId)).run();
    tx.delete(sessions).where(eq(sessions.userId, userId)).run();
    tx.delete(securityEvents).where(eq(securityEvents.userId, userId)).run();
    tx.update(users).set({ displayName: "", kind: "deleted" }).where(eq(users.id, userId)).run();
  });
  removeStoredFiles(ownReceipts.map((row) => row.storageKey ?? "").filter(Boolean));
  recordEvent(db, null, "account_deleted", { userId });
  return { ok: true as const };
}
