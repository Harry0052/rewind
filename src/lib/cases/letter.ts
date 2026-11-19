import { formatMinor } from "@/lib/money";
import { policyTypeLabel } from "@/lib/policies/samples";
import { formatCalendarDate } from "@/lib/time";

export type LetterInput = {
  merchantName: string;
  boughtOn: string;
  currency: string;
  totalAmountMinor: number;
  policyType: string;
  sourceTitle: string;
  sourceUrl: string;
  recordedAt: string;
  timezone: string;
  deadline: string;
  items: { description: string; quantity: number; lineTotalMinor: number }[];
  displayName: string;
};

export type EvidenceItem = { id: string; label: string; required: boolean; checked: boolean };

export function defaultEvidence(): EvidenceItem[] {
  return [
    { id: "receipt", label: "I can include the receipt or order confirmation when I send this.", required: true, checked: false },
    { id: "photo", label: "Photo of the item, if the stored policy asks for one.", required: false, checked: false },
    { id: "policy", label: "The policy source is named in the letter.", required: false, checked: true },
  ];
}

export function parseEvidence(json: string): EvidenceItem[] {
  try {
    const parsed = JSON.parse(json) as EvidenceItem[];
    if (!Array.isArray(parsed)) return defaultEvidence();
    const defaults = defaultEvidence();
    return defaults.map((item) => {
      const found = parsed.find((row) => row.id === item.id);
      return { ...item, checked: Boolean(found?.checked) };
    });
  } catch {
    return defaultEvidence();
  }
}

export function buildLetter(input: LetterInput) {
  const kind = policyTypeLabel(input.policyType).toLowerCase();
  const lines = input.items
    .map((item) => `- ${item.description} × ${item.quantity} — ${formatMinor(item.lineTotalMinor, input.currency)}`)
    .join("\n");
  const who = input.displayName.trim() || "A customer";
  const subject = `${policyTypeLabel(input.policyType)} request — ${input.merchantName} purchase on ${formatCalendarDate(input.boughtOn)}`;
  const body = [
    "Hello,",
    "",
    `I am writing about a purchase from ${input.merchantName} on ${formatCalendarDate(input.boughtOn)}. The recorded total is ${formatMinor(input.totalAmountMinor, input.currency)}.`,
    "",
    `I am asking about the ${kind} window Rewind has on file: ${input.sourceTitle} (${input.sourceUrl}), recorded on ${formatCalendarDate(input.recordedAt)}. The calculated last day in ${input.timezone} is ${formatCalendarDate(input.deadline)}. This note is my request. It is not a decision by the store.`,
    "",
    "Items:",
    lines,
    "",
    "Please tell me the next step. I can send the receipt if you need it.",
    "",
    "Thank you,",
    who,
  ].join("\n");
  return { subject, body };
}
