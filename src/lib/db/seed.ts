import { eq } from "drizzle-orm";
import { listPurchaseOpportunities } from "@/lib/opportunities/opportunities";
import { DEMO_USER_ID, ensureDemoUser } from "@/lib/purchases/purchases";
import { merchantKey, POLICY_RECORDED_AT, SAMPLE_POLICIES } from "@/lib/policies/samples";
import { addCalendarDays, calendarDateInZone, nowIso } from "@/lib/time";
import type { RewindDb } from "./client";
import { items, policies, purchases, receipts } from "./schema";

export function seedDemo(db: RewindDb) {
  for (const sample of SAMPLE_POLICIES) {
    const existing = db.select().from(policies).where(eq(policies.id, sample.id)).get();
    if (existing) continue;
    db.insert(policies)
      .values({
        id: sample.id,
        slug: sample.slug,
        merchantName: sample.merchantName,
        merchantKey: merchantKey(sample.merchantName),
        policyType: sample.policyType,
        version: sample.version,
        sourceUrl: `/policies/${sample.slug}`,
        sourceTitle: sample.sourceTitle,
        recordedAt: POLICY_RECORDED_AT,
        timezone: sample.timezone,
        windowDays: sample.windowDays,
        inclusive: sample.inclusive ? 1 : 0,
        currency: sample.currency,
        minAmountMinor: sample.minAmountMinor,
        conditionsNote: sample.conditionsNote,
        isDemo: 1,
        supersededAt: null,
      })
      .run();
  }
  seedSamplePurchases(db);
}

const SAMPLE_PURCHASES = [
  {
    id: "sample-harbor-coat",
    merchantName: "Harbor & Co.",
    daysAgo: 3,
    currency: "USD",
    note: "Sample receipt note. This is not your purchase.",
    items: [{ description: "Wool coat", quantity: 1, unitPriceMinor: 8600 }],
  },
  {
    id: "sample-northline-mug",
    merchantName: "Northline Goods",
    daysAgo: 120,
    currency: "USD",
    note: null,
    items: [{ description: "Stoneware mug", quantity: 1, unitPriceMinor: 1200 }],
  },
  {
    id: "sample-northline-sticker",
    merchantName: "Northline Goods",
    daysAgo: 1,
    currency: "USD",
    note: null,
    items: [{ description: "Sticker sheet", quantity: 2, unitPriceMinor: 150 }],
  },
] as const;

function seedSamplePurchases(db: RewindDb) {
  ensureDemoUser(db);
  const today = calendarDateInZone(new Date(), "America/New_York");
  for (const sample of SAMPLE_PURCHASES) {
    const boughtOn = addCalendarDays(today, -sample.daysAgo);
    const total = sample.items.reduce((sum, item) => sum + item.unitPriceMinor * item.quantity, 0);
    const existing = db.select().from(purchases).where(eq(purchases.id, sample.id)).get();
    const timestamp = nowIso();
    if (!existing) {
      db.insert(purchases)
        .values({
          id: sample.id,
          userId: DEMO_USER_ID,
          merchantName: sample.merchantName,
          merchantKey: merchantKey(sample.merchantName),
          boughtOn,
          currency: sample.currency,
          totalAmountMinor: total,
          note: sample.note,
          isDemo: 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .run();
      sample.items.forEach((item, position) => {
        db.insert(items)
          .values({
            id: `${sample.id}-item-${position}`,
            purchaseId: sample.id,
            description: item.description,
            quantity: item.quantity,
            unitPriceMinor: item.unitPriceMinor,
            lineTotalMinor: item.unitPriceMinor * item.quantity,
            position,
          })
          .run();
      });
      if (sample.note) {
        db.insert(receipts)
          .values({
            id: `${sample.id}-note`,
            purchaseId: sample.id,
            userId: DEMO_USER_ID,
            kind: "note",
            extractionStatus: "user_entered",
            note: sample.note,
            createdAt: timestamp,
          })
          .run();
      }
    } else {
      db.update(purchases)
        .set({ boughtOn, totalAmountMinor: total, updatedAt: timestamp })
        .where(eq(purchases.id, sample.id))
        .run();
    }
    listPurchaseOpportunities(db, sample.id);
  }
}
