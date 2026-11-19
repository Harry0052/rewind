import { describe, expect, it } from "vitest";
import { deadlineFor, evaluatePolicy, type PolicyRule } from "./eligibility";

const harbor: PolicyRule = {
  merchantName: "Harbor & Co.",
  policyType: "return",
  windowDays: 30,
  inclusive: true,
  timezone: "America/New_York",
  currency: "USD",
  minAmountMinor: null,
  sourceTitle: "sample",
  recordedAt: "2026-11-18",
};

const northline: PolicyRule = {
  merchantName: "Northline Goods",
  policyType: "return",
  windowDays: 14,
  inclusive: false,
  timezone: "America/Chicago",
  currency: "USD",
  minAmountMinor: 500,
  sourceTitle: "sample",
  recordedAt: "2026-11-18",
};

describe("eligibility", () => {
  it("keeps the deadline on the merchant calendar and honors inclusivity", () => {
    expect(deadlineFor("2026-03-01", 30, true)).toBe("2026-03-30");
    expect(deadlineFor("2026-03-01", 14, false)).toBe("2026-03-15");
    expect(deadlineFor("2026-01-31", 1, true)).toBe("2026-01-31");

    const stillOpen = evaluatePolicy(harbor, { boughtOn: "2026-03-01", totalAmountMinor: 8600, currency: "USD" }, new Date("2026-03-31T03:30:00Z"));
    expect(stillOpen.status).toBe("eligible");
    expect(stillOpen.deadline).toBe("2026-03-30");
    expect(stillOpen.explanation).not.toMatch(/guaranteed/i);

    const closed = evaluatePolicy(harbor, { boughtOn: "2026-03-01", totalAmountMinor: 8600, currency: "USD" }, new Date("2026-03-31T04:30:00Z"));
    expect(closed.status).toBe("expired");
    expect(closed.explanation).toMatch(/will not call it eligible/);
  });

  it("does not present a purchase outside the stored conditions as eligible", () => {
    const low = evaluatePolicy(northline, { boughtOn: "2026-03-01", totalAmountMinor: 499, currency: "USD" }, new Date("2026-03-02T18:00:00Z"));
    expect(low.status).toBe("outside_conditions");
    expect(low.estimatedAmountMinor).toBeNull();
    expect(low.explanation).toMatch(/does not treat it as eligible/);
    expect(low.explanation).not.toMatch(/guaranteed/i);

    const enough = evaluatePolicy(northline, { boughtOn: "2026-03-01", totalAmountMinor: 500, currency: "USD" }, new Date("2026-03-15T17:00:00Z"));
    expect(enough.status).toBe("eligible");
    expect(enough.deadline).toBe("2026-03-15");

    const nextDay = evaluatePolicy(northline, { boughtOn: "2026-03-01", totalAmountMinor: 500, currency: "USD" }, new Date("2026-03-16T16:00:00Z"));
    expect(nextDay.status).toBe("expired");
  });

  it("keeps a price-adjustment estimate empty and separate from recovered cash", () => {
    const price = evaluatePolicy(
      { ...harbor, policyType: "price_adjustment", windowDays: 14 },
      { boughtOn: "2026-03-01", totalAmountMinor: 8600, currency: "USD" },
      new Date("2026-03-02T15:00:00Z"),
    );
    expect(price.status).toBe("eligible");
    expect(price.estimatedAmountMinor).toBeNull();
    expect(price.explanation).toMatch(/no estimated refund/);
    expect(price.estimatedAmountMinor).not.toBe(8600);
  });
});
