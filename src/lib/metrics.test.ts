import { describe, expect, it } from "vitest";
import { createGuest } from "@/lib/auth/users";
import { prepareCase, recordCaseStatus } from "@/lib/cases/cases";
import { createTestDb } from "@/lib/db/client";
import { seedDemo } from "@/lib/db/seed";
import { countMetrics } from "@/lib/metrics";
import { listPurchaseOpportunities } from "@/lib/opportunities/opportunities";
import { createPurchase } from "@/lib/purchases/purchases";
import { validatePurchase } from "@/lib/validators/purchase";

describe("local metrics", () => {
  it("counts prepared cases per purchases without treating an estimate as a recovery", () => {
    const db = createTestDb();
    seedDemo(db);
    const guest = createGuest(db);
    if (!guest.ok) throw new Error("guest");
    const now = new Date("2026-11-18T15:00:00Z");
    const draft = validatePurchase(
      {
        merchantName: "Harbor & Co.",
        boughtOn: "2026-11-10",
        currency: "USD",
        note: "",
        slots: [{ description: "Coat", quantityRaw: "1", priceRaw: "20.00" }],
      },
      "America/New_York",
      now,
    );
    if (!draft.ok) throw new Error(draft.message);
    const purchaseId = createPurchase(db, guest.user.id, draft.draft);
    const opportunity = listPurchaseOpportunities(db, purchaseId, now).find((row) => row.type === "return");
    if (!opportunity) throw new Error("opportunity");
    const prepared = prepareCase(db, guest.user.id, opportunity.id, "");
    if (!prepared.ok) throw new Error(prepared.message);
    const before = countMetrics(db, guest.user.id);
    expect(before.purchases).toBe(1);
    expect(before.prepared).toBe(1);
    expect(before.recovered).toBe(0);
    expect(before.perHundred).toBe(100);
    recordCaseStatus(db, guest.user.id, prepared.id, "mark_won", { confirm: "yes", amount: "5.00" });
    expect(countMetrics(db, guest.user.id).recovered).toBe(1);
  });
});