import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { recordEvent } from "@/lib/audit";
import { buildLetter, defaultEvidence, parseEvidence, type EvidenceItem } from "@/lib/cases/letter";
import type { RewindDb } from "@/lib/db/client";
import { cases, items, opportunities, policies, purchases } from "@/lib/db/schema";
import { recordMetric } from "@/lib/metrics";
import { MoneyError, parseMajorToMinor, sumMinor } from "@/lib/money";
import { nowIso } from "@/lib/time";

const TERMINAL = new Set(["won", "denied", "withdrawn"]);

export function recoveredByCurrency(rows: { status: string; resultAmountMinor: number | null; resultCurrency: string | null }[]) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (row.status !== "won" || row.resultAmountMinor == null || !row.resultCurrency) continue;
    totals.set(row.resultCurrency, sumMinor([totals.get(row.resultCurrency) ?? 0, row.resultAmountMinor]));
  }
  return [...totals.entries()].map(([currency, amountMinor]) => ({ currency, amountMinor }));
}

export function listOwnCases(db: RewindDb, userId: string) {
  return db.select().from(cases).where(eq(cases.userId, userId)).all();
}

export function getCase(db: RewindDb, id: string, userId: string | null) {
  const row = db.select().from(cases).where(eq(cases.id, id)).get();
  if (!row || row.userId !== userId) return null;
  const opportunity = db.select().from(opportunities).where(eq(opportunities.id, row.opportunityId)).get();
  const purchase = opportunity ? db.select().from(purchases).where(eq(purchases.id, opportunity.purchaseId)).get() : null;
  return { caseRow: row, opportunity: opportunity ?? null, purchase: purchase ?? null, evidence: parseEvidence(row.evidenceJson) };
}

export function prepareCase(db: RewindDb, userId: string, opportunityId: string, displayName: string) {
  const opportunity = db.select().from(opportunities).where(eq(opportunities.id, opportunityId)).get();
  if (!opportunity || opportunity.userId !== userId) {
    return { ok: false as const, code: "not_found" as const, message: "That opportunity is not in this browser." };
  }
  if (opportunity.status !== "eligible") {
    return { ok: false as const, code: "closed" as const, message: "Rewind will not prepare a request unless the stored policy still shows an open window." };
  }
  const purchase = db.select().from(purchases).where(eq(purchases.id, opportunity.purchaseId)).get();
  const policy = db.select().from(policies).where(eq(policies.id, opportunity.policyId)).get();
  if (!purchase || !policy || purchase.isDemo === 1 || purchase.userId !== userId) {
    return { ok: false as const, code: "sample" as const, message: "Sample purchases cannot start a case." };
  }
  const existing = db.select().from(cases).where(eq(cases.opportunityId, opportunityId)).get();
  if (existing) return { ok: true as const, id: existing.id, created: false };
  const lines = db.select().from(items).where(eq(items.purchaseId, purchase.id)).all();
  const letter = buildLetter({
    merchantName: purchase.merchantName,
    boughtOn: purchase.boughtOn,
    currency: purchase.currency,
    totalAmountMinor: purchase.totalAmountMinor,
    policyType: policy.policyType,
    sourceTitle: policy.sourceTitle,
    sourceUrl: policy.sourceUrl,
    recordedAt: policy.recordedAt,
    timezone: policy.timezone,
    deadline: opportunity.deadline,
    items: lines,
    displayName,
  });
  const id = randomUUID();
  const timestamp = nowIso();
  db.insert(cases)
    .values({
      id,
      opportunityId,
      userId,
      status: "draft",
      subject: letter.subject,
      body: letter.body,
      evidenceJson: JSON.stringify(defaultEvidence()),
      resultAmountMinor: null,
      resultCurrency: null,
      recordedSentAt: null,
      resolvedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();
  recordEvent(db, userId, "case_prepared", { caseId: id, status: "draft" });
  recordMetric(db, userId, "case_prepared");
  return { ok: true as const, id, created: true };
}

export function saveCaseDraft(
  db: RewindDb,
  userId: string,
  id: string,
  input: { subject: string; body: string; checked: string[] },
) {
  const row = db.select().from(cases).where(and(eq(cases.id, id), eq(cases.userId, userId))).get();
  if (!row) return { ok: false as const, code: "not_found" as const, message: "That case is not in this browser." };
  if (TERMINAL.has(row.status)) {
    return { ok: false as const, code: "locked" as const, message: "This case is already closed. Rewind will not change the letter." };
  }
  const subject = input.subject.trim();
  const body = input.body.trim();
  if (subject.length < 3 || subject.length > 200) {
    return { ok: false as const, code: "subject" as const, message: "Enter a subject between 3 and 200 characters." };
  }
  if (body.length < 10 || body.length > 8000) {
    return { ok: false as const, code: "body" as const, message: "Enter a letter between 10 and 8,000 characters." };
  }
  const evidence: EvidenceItem[] = defaultEvidence().map((item) => ({ ...item, checked: input.checked.includes(item.id) }));
  db.update(cases)
    .set({ subject, body, evidenceJson: JSON.stringify(evidence), updatedAt: nowIso() })
    .where(and(eq(cases.id, id), eq(cases.userId, userId)))
    .run();
  recordEvent(db, userId, "case_draft_saved", { caseId: id, status: row.status });
  return { ok: true as const };
}

export function recordCaseStatus(
  db: RewindDb,
  userId: string,
  id: string,
  action: string,
  extra: { confirm: string; amount: string },
) {
  const row = db.select().from(cases).where(and(eq(cases.id, id), eq(cases.userId, userId))).get();
  if (!row) return { ok: false as const, code: "not_found" as const, message: "That case is not in this browser." };
  if (extra.confirm !== "yes") {
    return { ok: false as const, code: "confirm" as const, message: "Check the box so Rewind only records what you confirm." };
  }
  if (TERMINAL.has(row.status)) {
    return { ok: false as const, code: "locked" as const, message: "This outcome is already recorded. Rewind will not change it." };
  }
  const timestamp = nowIso();
  if (action === "record_sent") {
    db.update(cases)
      .set({ status: "recorded_sent", recordedSentAt: row.recordedSentAt ?? timestamp, updatedAt: timestamp })
      .where(eq(cases.id, id))
      .run();
    recordEvent(db, userId, "case_recorded_sent", { caseId: id, status: "recorded_sent" });
    return { ok: true as const, notice: "sent" as const };
  }
  if (action === "withdraw") {
    db.update(cases).set({ status: "withdrawn", resolvedAt: timestamp, updatedAt: timestamp }).where(eq(cases.id, id)).run();
    closeOpportunity(db, row.opportunityId);
    recordEvent(db, userId, "case_withdrawn", { caseId: id, status: "withdrawn" });
    return { ok: true as const, notice: "withdrawn" as const };
  }
  if (action === "mark_denied") {
    db.update(cases).set({ status: "denied", resolvedAt: timestamp, updatedAt: timestamp, resultAmountMinor: null }).where(eq(cases.id, id)).run();
    closeOpportunity(db, row.opportunityId);
    recordEvent(db, userId, "case_denied", { caseId: id, status: "denied" });
    return { ok: true as const, notice: "denied" as const };
  }
  if (action === "mark_won") {
    const opportunity = db.select().from(opportunities).where(eq(opportunities.id, row.opportunityId)).get();
    const purchase = opportunity ? db.select().from(purchases).where(eq(purchases.id, opportunity.purchaseId)).get() : null;
    if (!purchase) return { ok: false as const, code: "not_found" as const, message: "That purchase is missing." };
    let amount: number;
    try {
      amount = parseMajorToMinor(extra.amount);
    } catch (error) {
      const message = error instanceof MoneyError ? error.message : "Enter the amount you actually received, like 24.50.";
      return { ok: false as const, code: "amount" as const, message };
    }
    if (amount <= 0 || amount > purchase.totalAmountMinor) {
      return {
        ok: false as const,
        code: "amount" as const,
        message: "Enter the amount you received, up to the recorded purchase total. Rewind will not count an estimate.",
      };
    }
    db.update(cases)
      .set({
        status: "won",
        resultAmountMinor: amount,
        resultCurrency: purchase.currency,
        resolvedAt: timestamp,
        recordedSentAt: row.recordedSentAt ?? timestamp,
        updatedAt: timestamp,
      })
      .where(eq(cases.id, id))
      .run();
    closeOpportunity(db, row.opportunityId);
    recordEvent(db, userId, "case_won", { caseId: id, status: "won", resultAmountMinor: amount, currency: purchase.currency });
    recordMetric(db, userId, "recovery_confirmed");
    return { ok: true as const, notice: "won" as const };
  }
  return { ok: false as const, code: "status" as const, message: "Rewind does not recognize that update." };
}

function closeOpportunity(db: RewindDb, opportunityId: string) {
  db.update(opportunities).set({ status: "closed", evaluatedAt: nowIso() }).where(eq(opportunities.id, opportunityId)).run();
}

export function caseIsSubmitted(status: string) {
  return status === "recorded_sent" || status === "won" || status === "denied";
}
