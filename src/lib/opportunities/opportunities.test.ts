import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createGuest } from "@/lib/auth/users";
import { createTestDb } from "@/lib/db/client";
import { policies } from "@/lib/db/schema";
import { seedDemo } from "@/lib/db/seed";
import { merchantKey } from "@/lib/policies/samples";
import { createPurchase } from "@/lib/purchases/purchases";
import { validatePurchase } from "@/lib/validators/purchase";
import { getOpportunity, listPurchaseOpportunities, openEstimatesByCurrency } from "./opportunities";

const now = new Date("2026-11-18T15:00:00Z");

function savedDraft(merchant: string, price: string, boughtOn: string) {
  const result = validatePurchase(
    {
      merchantName: merchant,
      boughtOn,
      currency: "USD",
      note: "",
      slots: [{ description: "Item", quantityRaw: "1", priceRaw: price }],
    },
    "America/New_York",
    now,
  );
  if (!result.ok) throw new Error(result.message);
  return result.draft;
}

describe("stored opportunities", () => {
  it("explains an open Harbor return and a below-minimum Northline purchase", () => {
    const db = createTestDb();
    seedDemo(db);
    const guest = createGuest(db);
    if (!guest.ok) throw new Error("guest");
    const harborId = createPurchase(db, guest.user.id, savedDraft("Harbor & Co.", "48.00", "2026-11-10"));
    const lowId = createPurchase(db, guest.user.id, savedDraft("Northline Goods", "3.00", "2026-11-16"));
    const harbor = listPurchaseOpportunities(db, harborId, now).find((row) => row.type === "return");
    const low = listPurchaseOpportunities(db, lowId, now).find((row) => row.type === "return");
    expect(harbor?.status).toBe("eligible");
    expect(harbor?.deadline).toBe("2026-12-09");
    expect(low?.status).toBe("outside_conditions");
    expect(low?.explanation).toMatch(/does not treat it as eligible/);
    const other = createGuest(db);
    if (!other.ok || !harbor) throw new Error("setup");
    expect(getOpportunity(db, harbor.id, other.user.id, now)).toBeNull();
    const estimates = openEstimatesByCurrency(listPurchaseOpportunities(db, harborId, now));
    expect(estimates.find((row) => row.currency === "USD")?.amountMinor).toBe(4800 + 4800);
  });

  it("uses the active policy version and ignores a superseded window", () => {
    const db = createTestDb();
    seedDemo(db);
    const guest = createGuest(db);
    if (!guest.ok) throw new Error("guest");
    db.update(policies).set({ supersededAt: "2026-11-18T00:00:00.000Z" }).where(eq(policies.id, "policy-fieldnote-return-v1")).run();
    db.insert(policies)
      .values({
        id: "policy-fieldnote-return-v2",
        slug: "fieldnote-return-v2",
        merchantName: "Fieldnote Supply",
        merchantKey: merchantKey("Fieldnote Supply"),
        policyType: "return",
        version: 2,
        sourceUrl: "/policies/fieldnote-return-v2",
        sourceTitle: "Rewind sample policy version 2",
        recordedAt: "2026-11-18",
        timezone: "America/Los_Angeles",
        windowDays: 7,
        inclusive: 1,
        currency: "USD",
        minAmountMinor: null,
        conditionsNote: "Shorter sample window.",
        isDemo: 1,
        supersededAt: null,
      })
      .run();
    const id = createPurchase(db, guest.user.id, savedDraft("Fieldnote Supply", "20.00", "2026-11-01"));
    const rows = listPurchaseOpportunities(db, id, now);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.policyId).toBe("policy-fieldnote-return-v2");
    expect(rows[0]?.deadline).toBe("2026-11-07");
    expect(rows[0]?.status).toBe("expired");
  });
});
