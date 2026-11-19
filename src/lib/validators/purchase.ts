import { z } from "zod";
import { isCurrency, multiplyMinor, parseMajorToMinor, sumMinor, type CurrencyCode } from "@/lib/money";
import { calendarDateInZone, isIsoDate } from "@/lib/time";

const merchantPattern = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} &.'’,-]{1,79}$/u;

export type ItemDraft = {
  description: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
};

export type PurchaseDraft = {
  merchantName: string;
  boughtOn: string;
  currency: CurrencyCode;
  note: string;
  items: ItemDraft[];
  totalAmountMinor: number;
};

export type DraftError = { ok: false; code: string; message: string };

const draftSchema = z.object({
  merchantName: z.string().trim().min(2).max(80),
  boughtOn: z.string(),
  currency: z.enum(["USD", "EUR", "GBP", "CAD"]),
  note: z.string().max(2000),
  items: z
    .array(
      z.object({
        description: z.string().trim().min(1).max(140),
        quantity: z.number().int().min(1).max(99),
        unitPriceMinor: z.number().int().positive().max(100_000_000),
      }),
    )
    .min(1)
    .max(8),
});

export function slotsFromLists(lists: Record<string, string[]>) {
  const descriptions = lists.item_description ?? [];
  const quantities = lists.item_quantity ?? [];
  const prices = lists.item_price ?? [];
  const count = Math.max(descriptions.length, quantities.length, prices.length);
  const slots: { description: string; quantityRaw: string; priceRaw: string }[] = [];
  for (let index = 0; index < count; index += 1) {
    const description = (descriptions[index] ?? "").trim();
    const quantityRaw = (quantities[index] ?? "").trim();
    const priceRaw = (prices[index] ?? "").trim();
    if (!description && !priceRaw) continue;
    slots.push({ description, quantityRaw: quantityRaw || "1", priceRaw });
  }
  return slots;
}

export function validatePurchase(
  input: {
    merchantName: string;
    boughtOn: string;
    currency: string;
    note: string;
    slots: { description: string; quantityRaw: string; priceRaw: string }[];
  },
  timeZone: string,
  now = new Date(),
): { ok: true; draft: PurchaseDraft } | DraftError {
  if (input.slots.length === 0) {
    return { ok: false, code: "items", message: "Add at least one item with a description and a price." };
  }
  if (input.slots.length > 8) {
    return { ok: false, code: "items", message: "Rewind stores up to 8 items on one purchase." };
  }

  const items: ItemDraft[] = [];
  for (const slot of input.slots) {
    if (!slot.description) {
      return { ok: false, code: "items", message: "Each priced row needs a description." };
    }
    if (/[<>]/.test(slot.description) || /[<>]/.test(input.merchantName)) {
      return { ok: false, code: "merchant", message: "Use the store and item names without code or angle brackets." };
    }
    let unitPriceMinor: number;
    try {
      unitPriceMinor = parseMajorToMinor(slot.priceRaw);
    } catch {
      return { ok: false, code: "items", message: "Enter each price like 24.50, with at most two cents." };
    }
    if (unitPriceMinor <= 0) {
      return { ok: false, code: "items", message: "Each item needs a price above zero." };
    }
    if (!/^\d{1,2}$/.test(slot.quantityRaw)) {
      return { ok: false, code: "items", message: "Quantity needs to be a whole number from 1 to 99." };
    }
    const quantity = Number(slot.quantityRaw);
    if (quantity < 1 || quantity > 99) {
      return { ok: false, code: "items", message: "Quantity needs to be a whole number from 1 to 99." };
    }
    let lineTotalMinor: number;
    try {
      lineTotalMinor = multiplyMinor(unitPriceMinor, quantity);
    } catch {
      return { ok: false, code: "items", message: "That line total is too large." };
    }
    if (lineTotalMinor > 100_000_000) {
      return { ok: false, code: "items", message: "Each line needs to be $1,000,000.00 or less." };
    }
    items.push({ description: slot.description.trim(), quantity, unitPriceMinor, lineTotalMinor });
  }

  let totalAmountMinor: number;
  try {
    totalAmountMinor = sumMinor(items.map((item) => item.lineTotalMinor));
  } catch {
    return { ok: false, code: "items", message: "Those prices add up past what Rewind can store." };
  }
  if (totalAmountMinor <= 0 || totalAmountMinor > 100_000_000) {
    return { ok: false, code: "items", message: "The total needs to be between 0.01 and 1,000,000.00." };
  }

  const parsed = draftSchema.safeParse({
    merchantName: input.merchantName,
    boughtOn: input.boughtOn,
    currency: input.currency,
    note: input.note.trim(),
    items,
  });
  if (!parsed.success) {
    const path = parsed.error.issues[0]?.path[0];
    if (path === "merchantName") {
      return { ok: false, code: "merchant", message: "Enter the store name, between 2 and 80 characters." };
    }
    if (path === "currency") {
      return { ok: false, code: "currency", message: "Choose USD, EUR, GBP, or CAD." };
    }
    if (path === "note") {
      return { ok: false, code: "note", message: "Keep the receipt note under 2,000 characters." };
    }
    return { ok: false, code: "items", message: "Check the item names, quantities, and prices." };
  }

  const merchantName = parsed.data.merchantName.replace(/\s+/g, " ");
  if (!merchantPattern.test(merchantName)) {
    return {
      ok: false,
      code: "merchant",
      message: "Use the store’s name. Letters, numbers, spaces, and & . ' - are fine.",
    };
  }
  if (!isCurrency(parsed.data.currency)) {
    return { ok: false, code: "currency", message: "Choose USD, EUR, GBP, or CAD." };
  }
  if (!isIsoDate(parsed.data.boughtOn)) {
    return { ok: false, code: "date", message: "Enter the purchase date." };
  }
  const today = calendarDateInZone(now, timeZone);
  if (parsed.data.boughtOn > today) {
    return { ok: false, code: "date", message: "The purchase date cannot be in the future." };
  }
  if (parsed.data.boughtOn < "2000-01-01") {
    return { ok: false, code: "date", message: "Rewind starts purchase dates at January 1, 2000." };
  }

  return {
    ok: true,
    draft: {
      merchantName,
      boughtOn: parsed.data.boughtOn,
      currency: parsed.data.currency,
      note: parsed.data.note,
      items,
      totalAmountMinor,
    },
  };
}
