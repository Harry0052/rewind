export type SamplePolicy = {
  id: string;
  slug: string;
  merchantName: string;
  policyType: "return" | "warranty" | "price_adjustment";
  version: number;
  sourceTitle: string;
  timezone: string;
  windowDays: number;
  inclusive: boolean;
  currency: "USD";
  minAmountMinor: number | null;
  conditionsNote: string;
};

export const POLICY_RECORDED_AT = "2026-11-18";

export const SAMPLE_POLICIES: SamplePolicy[] = [
  {
    id: "policy-harbor-return-v1",
    slug: "harbor-return",
    merchantName: "Harbor & Co.",
    policyType: "return",
    version: 1,
    sourceTitle: "Rewind sample policy for Harbor & Co. returns",
    timezone: "America/New_York",
    windowDays: 30,
    inclusive: true,
    currency: "USD",
    minAmountMinor: null,
    conditionsNote:
      "Sample rule written for Rewind. Harbor & Co. is not a real store. The purchase date counts as day 1. Rewind cannot tell whether an item is unworn, or whether a store would accept the return.",
  },
  {
    id: "policy-harbor-warranty-v1",
    slug: "harbor-warranty",
    merchantName: "Harbor & Co.",
    policyType: "warranty",
    version: 1,
    sourceTitle: "Rewind sample policy for Harbor & Co. warranty",
    timezone: "America/New_York",
    windowDays: 365,
    inclusive: true,
    currency: "USD",
    minAmountMinor: null,
    conditionsNote:
      "Sample warranty window. Harbor & Co. is not a real store. Rewind cannot tell whether an item has a defect or whether a repair is covered.",
  },
  {
    id: "policy-harbor-price-v1",
    slug: "harbor-price",
    merchantName: "Harbor & Co.",
    policyType: "price_adjustment",
    version: 1,
    sourceTitle: "Rewind sample policy for Harbor & Co. price adjustments",
    timezone: "America/New_York",
    windowDays: 14,
    inclusive: true,
    currency: "USD",
    minAmountMinor: null,
    conditionsNote:
      "Sample price-adjustment window. Harbor & Co. is not a real store. Rewind does not watch prices and does not know whether a price dropped.",
  },
  {
    id: "policy-northline-return-v1",
    slug: "northline-return",
    merchantName: "Northline Goods",
    policyType: "return",
    version: 1,
    sourceTitle: "Rewind sample policy for Northline Goods returns",
    timezone: "America/Chicago",
    windowDays: 14,
    inclusive: false,
    currency: "USD",
    minAmountMinor: 500,
    conditionsNote:
      "Sample rule. Northline Goods is not a real store. Purchases under $5.00 are outside this policy. The purchase date does not count as one of the 14 days.",
  },
  {
    id: "policy-fieldnote-return-v1",
    slug: "fieldnote-return",
    merchantName: "Fieldnote Supply",
    policyType: "return",
    version: 1,
    sourceTitle: "Rewind sample policy for Fieldnote Supply returns",
    timezone: "America/Los_Angeles",
    windowDays: 45,
    inclusive: true,
    currency: "USD",
    minAmountMinor: null,
    conditionsNote:
      "Sample rule. Fieldnote Supply is not a real store. The purchase date counts as day 1. Rewind cannot check the condition of the item.",
  },
];

export function merchantKey(name: string) {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function policyTypeLabel(type: string) {
  if (type === "return") return "Return";
  if (type === "warranty") return "Warranty";
  if (type === "price_adjustment") return "Price adjustment";
  return "Policy";
}

export function describeWindow(windowDays: number, inclusive: boolean) {
  if (inclusive) {
    const day = windowDays === 1 ? "day" : "days";
    return `${windowDays} ${day}. The purchase date counts as day 1.`;
  }
  const day = windowDays === 1 ? "day" : "days";
  return `${windowDays} ${day} after the purchase date. The purchase date does not count.`;
}
