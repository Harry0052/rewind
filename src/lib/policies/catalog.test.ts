import { describe, expect, it } from "vitest";
import { createTestDb } from "@/lib/db/client";
import { seedDemo } from "@/lib/db/seed";
import { listActivePolicies, getPolicyBySlug } from "./catalog";
import { describeWindow } from "./samples";

describe("sample policies", () => {
  it("seeds five demo policies and describes inclusive windows", () => {
    const db = createTestDb();
    seedDemo(db);
    seedDemo(db);
    const rows = listActivePolicies(db);
    expect(rows).toHaveLength(5);
    expect(rows.every((row) => row.isDemo === 1)).toBe(true);
    const harbor = getPolicyBySlug(db, "harbor-return");
    expect(harbor?.inclusive).toBe(1);
    expect(harbor?.windowDays).toBe(30);
    expect(describeWindow(30, true)).toMatch(/counts as day 1/);
    const northline = getPolicyBySlug(db, "northline-return");
    expect(northline?.inclusive).toBe(0);
    expect(northline?.minAmountMinor).toBe(500);
    expect(describeWindow(14, false)).toMatch(/does not count/);
  });
});
