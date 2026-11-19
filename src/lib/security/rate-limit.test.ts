import { describe, expect, it } from "vitest";
import { createTestDb } from "@/lib/db/client";
import { consumeRateLimit } from "./rate-limit";

describe("rate limit", () => {
  it("blocks the request after the limit inside one window", () => {
    const db = createTestDb();
    const now = Date.parse("2026-11-18T12:00:00Z");
    expect(consumeRateLimit(db, "settings:a", 2, 60_000, now)).toBe(true);
    expect(consumeRateLimit(db, "settings:a", 2, 60_000, now + 10)).toBe(true);
    expect(consumeRateLimit(db, "settings:a", 2, 60_000, now + 20)).toBe(false);
    expect(consumeRateLimit(db, "settings:a", 2, 60_000, now + 60_000)).toBe(true);
  });
});
