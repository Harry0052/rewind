import { describe, expect, it } from "vitest";
import { createTestDb } from "./client";
import { policies, users } from "./schema";

describe("migrations", () => {
  it("creates the foundation tables", () => {
    const db = createTestDb();
    expect(db.select().from(users).all()).toEqual([]);
    expect(db.select().from(policies).all()).toEqual([]);
  });
});
