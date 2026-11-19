import { describe, expect, it } from "vitest";
import { createGuest } from "@/lib/auth/users";
import { createTestDb } from "@/lib/db/client";
import { seedDemo } from "@/lib/db/seed";
import { items } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createPurchase, deletePurchase, getPurchase, listOwnPurchases, updatePurchase } from "./purchases";
import { validatePurchase } from "@/lib/validators/purchase";

const now = new Date("2026-11-18T15:00:00Z");

function draft(overrides?: Partial<Parameters<typeof validatePurchase>[0]>) {
  const result = validatePurchase(
    {
      merchantName: "Harbor & Co.",
      boughtOn: "2026-11-01",
      currency: "USD",
      note: "Order 100",
      slots: [
        { description: "Wool coat", quantityRaw: "1", priceRaw: "86.00" },
        { description: "Scarf", quantityRaw: "2", priceRaw: "12.50" },
      ],
      ...overrides,
    },
    "America/New_York",
    now,
  );
  if (!result.ok) throw new Error(result.message);
  return result.draft;
}

describe("purchase ledger", () => {
  it("stores several purchases and keeps totals in minor units", () => {
    const db = createTestDb();
    const guest = createGuest(db);
    if (!guest.ok) throw new Error("guest");
    const first = draft();
    expect(first.totalAmountMinor).toBe(8600 + 2500);
    const firstId = createPurchase(db, guest.user.id, first);
    const second = draft({
      merchantName: "Fieldnote Supply",
      slots: [{ description: "Notebook", quantityRaw: "1", priceRaw: "10.10" }],
      note: "",
    });
    expect(second.totalAmountMinor).toBe(1010);
    createPurchase(db, guest.user.id, second);

    const rows = listOwnPurchases(db, guest.user.id);
    expect(rows).toHaveLength(2);
    const loaded = getPurchase(db, firstId, guest.user.id);
    expect(loaded?.purchase.totalAmountMinor).toBe(11100);
    expect(loaded?.items.map((item) => item.lineTotalMinor)).toEqual([8600, 2500]);
    expect(loaded?.note).toBe("Order 100");

    const updated = updatePurchase(
      db,
      guest.user.id,
      firstId,
      draft({ slots: [{ description: "Wool coat", quantityRaw: "1", priceRaw: "80.00" }] }),
    );
    expect(updated.ok).toBe(true);
    expect(getPurchase(db, firstId, guest.user.id)?.purchase.totalAmountMinor).toBe(8000);
    const lineCount = db.select().from(items).where(eq(items.purchaseId, firstId)).all();
    expect(lineCount).toHaveLength(1);
  });

  it("hides a purchase from another browser and refuses sample edits", () => {
    const db = createTestDb();
    seedDemo(db);
    const owner = createGuest(db);
    const other = createGuest(db);
    if (!owner.ok || !other.ok) throw new Error("guest");
    const id = createPurchase(db, owner.user.id, draft({ note: "" }));
    expect(getPurchase(db, id, other.user.id)).toBeNull();
    expect(deletePurchase(db, other.user.id, id).ok).toBe(false);
    expect(getPurchase(db, id, owner.user.id)?.purchase.merchantName).toBe("Harbor & Co.");

    const sample = getPurchase(db, "sample-northline-sticker", null);
    expect(sample?.purchase.totalAmountMinor).toBe(300);
    expect(sample?.purchase.isDemo).toBe(1);
    expect(updatePurchase(db, owner.user.id, "sample-northline-sticker", draft()).ok).toBe(false);
    expect(deletePurchase(db, owner.user.id, id).ok).toBe(true);
    expect(getPurchase(db, id, owner.user.id)).toBeNull();
  });

  it("rejects a future date and a price that is not cents", () => {
    const future = validatePurchase(
      {
        merchantName: "Harbor & Co.",
        boughtOn: "2026-11-19",
        currency: "USD",
        note: "",
        slots: [{ description: "Mug", quantityRaw: "1", priceRaw: "5.00" }],
      },
      "America/New_York",
      now,
    );
    expect(future.ok).toBe(false);
    const cents = validatePurchase(
      {
        merchantName: "Harbor & Co.",
        boughtOn: "2026-11-01",
        currency: "USD",
        note: "",
        slots: [{ description: "Mug", quantityRaw: "1", priceRaw: "5.999" }],
      },
      "America/New_York",
      now,
    );
    expect(cents.ok).toBe(false);
  });
});
