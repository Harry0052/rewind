import { describe, expect, it } from "vitest";
import { createGuest } from "@/lib/auth/users";
import { recoveredByCurrency, prepareCase, recordCaseStatus, getCase } from "@/lib/cases/cases";
import { buildLetter } from "@/lib/cases/letter";
import { createTestDb } from "@/lib/db/client";
import { seedDemo } from "@/lib/db/seed";
import { listPurchaseOpportunities, openEstimatesByCurrency } from "@/lib/opportunities/opportunities";
import { createPurchase } from "@/lib/purchases/purchases";
import { validatePurchase } from "@/lib/validators/purchase";

const now = new Date("2026-11-18T15:00:00Z");

describe("cases", () => {
  it("stays unsent until the user records a send, and recovered cash excludes estimates", () => {
    const db = createTestDb();
    seedDemo(db);
    const guest = createGuest(db);
    if (!guest.ok) throw new Error("guest");
    const draft = validatePurchase(
      {
        merchantName: "Harbor & Co.",
        boughtOn: "2026-11-10",
        currency: "USD",
        note: "",
        slots: [{ description: "Coat", quantityRaw: "1", priceRaw: "48.00" }],
      },
      "America/New_York",
      now,
    );
    if (!draft.ok) throw new Error(draft.message);
    const purchaseId = createPurchase(db, guest.user.id, draft.draft);
    const opportunity = listPurchaseOpportunities(db, purchaseId, now).find((row) => row.type === "return");
    if (!opportunity) throw new Error("opportunity");
    const created = prepareCase(db, guest.user.id, opportunity.id, "Amina");
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const again = prepareCase(db, guest.user.id, opportunity.id, "Amina");
    expect(again.ok && again.id).toBe(created.id);
    const loaded = getCase(db, created.id, guest.user.id);
    expect(loaded?.caseRow.status).toBe("draft");
    expect(loaded?.caseRow.body).toMatch(/not a decision by the store/);
    expect(loaded?.caseRow.recordedSentAt).toBeNull();

    const other = createGuest(db);
    if (!other.ok) throw new Error("other");
    expect(getCase(db, created.id, other.user.id)).toBeNull();
    expect(recordCaseStatus(db, other.user.id, created.id, "record_sent", { confirm: "yes", amount: "" }).ok).toBe(false);

    const unconfirmed = recordCaseStatus(db, guest.user.id, created.id, "record_sent", { confirm: "", amount: "" });
    expect(unconfirmed.ok).toBe(false);
    expect(getCase(db, created.id, guest.user.id)?.caseRow.status).toBe("draft");

    const sent = recordCaseStatus(db, guest.user.id, created.id, "record_sent", { confirm: "yes", amount: "" });
    expect(sent.ok).toBe(true);
    expect(getCase(db, created.id, guest.user.id)?.caseRow.status).toBe("recorded_sent");

    const won = recordCaseStatus(db, guest.user.id, created.id, "mark_won", { confirm: "yes", amount: "10.00" });
    expect(won.ok).toBe(true);
    const closed = getCase(db, created.id, guest.user.id);
    expect(closed?.caseRow.resultAmountMinor).toBe(1000);
    const recovered = recoveredByCurrency(closed ? [closed.caseRow] : []);
    expect(recovered).toEqual([{ currency: "USD", amountMinor: 1000 }]);
    const estimates = openEstimatesByCurrency(listPurchaseOpportunities(db, purchaseId, now));
    const returnEstimate = listPurchaseOpportunities(db, purchaseId, now).find((row) => row.type === "return");
    expect(returnEstimate?.status).toBe("closed");
    expect(estimates).toEqual([{ currency: "USD", amountMinor: 4800 }]);
    expect(recovered[0]?.amountMinor).toBe(1000);
  });

  it("builds a letter without calling the outcome a refund already paid", () => {
    const letter = buildLetter({
      merchantName: "Harbor & Co.",
      boughtOn: "2026-11-10",
      currency: "USD",
      totalAmountMinor: 4800,
      policyType: "return",
      sourceTitle: "Sample",
      sourceUrl: "/policies/harbor-return",
      recordedAt: "2026-11-18",
      timezone: "America/New_York",
      deadline: "2026-12-09",
      items: [{ description: "Coat", quantity: 1, lineTotalMinor: 4800 }],
      displayName: "",
    });
    expect(letter.body).toMatch(/A customer/);
    expect(letter.body).not.toMatch(/refunded/i);
    expect(letter.subject).toMatch(/Harbor & Co./);
  });
});
