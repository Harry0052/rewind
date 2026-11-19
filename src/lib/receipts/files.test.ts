import { describe, expect, it } from "vitest";
import { createGuest } from "@/lib/auth/users";
import { createTestDb } from "@/lib/db/client";
import { createPurchase } from "@/lib/purchases/purchases";
import { validatePurchase } from "@/lib/validators/purchase";
import { detectFile, readOwnedReceipt, resolveStoredFile, saveReceiptFile } from "./files";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

describe("receipt files", () => {
  it("stores a PNG for the owner and hides it from everyone else", () => {
    const db = createTestDb();
    const owner = createGuest(db);
    const other = createGuest(db);
    if (!owner.ok || !other.ok) throw new Error("guest");
    const draft = validatePurchase(
      {
        merchantName: "Harbor & Co.",
        boughtOn: "2026-11-01",
        currency: "USD",
        note: "",
        slots: [{ description: "Coat", quantityRaw: "1", priceRaw: "10.00" }],
      },
      "America/New_York",
      new Date("2026-11-18T15:00:00Z"),
    );
    if (!draft.ok) throw new Error(draft.message);
    const purchaseId = createPurchase(db, owner.user.id, draft.draft);
    expect(detectFile(png)?.mime).toBe("image/png");
    expect(detectFile(Buffer.from("hello"))).toBeNull();
    expect(resolveStoredFile("../etc/passwd")).toBeNull();
    const saved = saveReceiptFile(db, owner.user.id, purchaseId, "receipt.png", png);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(readOwnedReceipt(db, saved.id, owner.user.id)?.bytes.equals(png)).toBe(true);
    expect(readOwnedReceipt(db, saved.id, other.user.id)).toBeNull();
    expect(saveReceiptFile(db, other.user.id, purchaseId, "x.png", png).ok).toBe(false);
  });
});
