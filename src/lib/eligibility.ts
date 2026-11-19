import { formatMinor } from "@/lib/money";
import { describeWindow, policyTypeLabel } from "@/lib/policies/samples";
import { addCalendarDays, calendarDateInZone, compareIsoDates, formatCalendarDate } from "@/lib/time";

export type PolicyRule = {
  merchantName: string;
  policyType: string;
  windowDays: number;
  inclusive: boolean;
  timezone: string;
  currency: string;
  minAmountMinor: number | null;
  sourceTitle: string;
  recordedAt: string;
};

export type Evaluation = {
  status: "eligible" | "expired" | "outside_conditions";
  deadline: string;
  estimatedAmountMinor: number | null;
  explanation: string;
};

const CAVEAT = "This is a calculation from the policy stored in Rewind, not a promise the store will pay you.";

export function deadlineFor(boughtOn: string, windowDays: number, inclusive: boolean) {
  if (!Number.isInteger(windowDays) || windowDays < 1) {
    throw new Error("A policy window must be at least 1 day.");
  }
  const offset = inclusive ? windowDays - 1 : windowDays;
  return addCalendarDays(boughtOn, offset);
}

export function evaluatePolicy(
  policy: PolicyRule,
  purchase: { boughtOn: string; totalAmountMinor: number; currency: string },
  now = new Date(),
): Evaluation {
  const deadline = deadlineFor(purchase.boughtOn, policy.windowDays, policy.inclusive);
  const today = calendarDateInZone(now, policy.timezone);
  const window = describeWindow(policy.windowDays, policy.inclusive);
  const kind = policyTypeLabel(policy.policyType).toLowerCase();
  const lastDay = formatCalendarDate(deadline);
  const todayLabel = formatCalendarDate(today);

  if (policy.minAmountMinor != null && purchase.currency !== policy.currency) {
    return {
      status: "outside_conditions",
      deadline,
      estimatedAmountMinor: null,
      explanation: `The stored ${policy.merchantName} ${kind} policy states an amount condition in ${policy.currency}. This purchase is in ${purchase.currency}, so Rewind will not treat the amounts as comparable or call the purchase eligible. ${CAVEAT}`,
    };
  }

  if (policy.minAmountMinor != null && purchase.totalAmountMinor < policy.minAmountMinor) {
    return {
      status: "outside_conditions",
      deadline,
      estimatedAmountMinor: null,
      explanation: `The stored ${policy.merchantName} ${kind} policy applies from ${formatMinor(policy.minAmountMinor, policy.currency)}. This purchase is ${formatMinor(purchase.totalAmountMinor, purchase.currency)}, so it is outside those conditions. Rewind does not treat it as eligible. ${CAVEAT}`,
    };
  }

  const open = compareIsoDates(today, deadline) <= 0;
  const estimate = policy.policyType === "price_adjustment" ? null : purchase.totalAmountMinor;
  if (!open) {
    return {
      status: "expired",
      deadline,
      estimatedAmountMinor: estimate,
      explanation: `The stored ${policy.merchantName} ${kind} policy is ${window} The last day was ${lastDay} in ${policy.timezone}. Today there is ${todayLabel}, so this window is closed under the stored policy. Rewind will not call it eligible. ${CAVEAT}`,
    };
  }

  const estimateSentence =
    estimate == null
      ? "Rewind does not know whether the price dropped, so there is no estimated refund."
      : `The figure ${formatMinor(estimate, purchase.currency)} is the recorded purchase total, not money received.`;

  return {
    status: "eligible",
    deadline,
    estimatedAmountMinor: estimate,
    explanation: `The stored ${policy.merchantName} ${kind} policy is ${window} The last day is ${lastDay} in ${policy.timezone}. Today there is ${todayLabel}, so the window is still open under that stored rule. ${estimateSentence} ${CAVEAT}`,
  };
}

export function confirmedIsSeparate(estimated: number | null, recovered: number) {
  return { estimated, recovered, mixed: false as const };
}
