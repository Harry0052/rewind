import { describe, expect, it } from "vitest";
import { deleteAccount, exportAccount } from "@/lib/account/account";
import { createGuest } from "@/lib/auth/users";
import { recoveredByCurrency } from "@/lib/cases/cases";
import { createTestDb } from "@/lib/db/client";
import { createPurchase } from "@/lib/purchases/purchases";
import { validatePurchase } from "@/lib/validators/purchase";

describe("account privacy", () => {
  it("exports only the owner and delete removes the purchase", () => {
    const db = createTestDb();
    const owner = createGuest(db);
    const other = createGuest(db);
    if (!owner.ok || !other.ok) throw new Error("guest");
    const draft = validatePurchase(
      {
        merchantName: "Fieldnote Supply",
        boughtOn: "2026-11-02",
        currency: "USD",
        note: "keep private",
        slots: [{ description: "Notebook", quantityRaw: "1", priceRaw: "12.00" }],
      },
      "America/New_York",
      new Date("2026-11-18T15:00:00Z"),
    );
    if (!draft.ok) throw new Error(draft.message);
    createPurchase(db, owner.user.id, draft.draft);
    createPurchase(db, other.user.id, { ...draft.draft, merchantName: "Other Shop" });
    const exported = exportAccount(db, owner.user.id);
    expect(exported?.purchases.map((row) => row.merchantName)).toEqual(["Fieldnote Supply"]);
    expect(JSON.stringify(exported)).not.toContain("Other Shop");
    expect(exported?.purchases[0]?.note).toBe("keep private");
    expect(recoveredByCurrency([])).toEqual([]);
    expect(deleteAccount(db, owner.user.id).ok).toBe(true);
    expect(exportAccount(db, owner.user.id)).toBeNull();
    expect(exportAccount(db, other.user.id)?.purchases).toHaveLength(1);
  });
});
