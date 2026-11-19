import { describe, expect, it } from "vitest";
import { createTestDb } from "@/lib/db/client";
import { createGuest, updateProfile } from "./users";

describe("profile", () => {
  it("stores a name and timezone and rejects an email address", () => {
    const db = createTestDb();
    const guest = createGuest(db);
    expect(guest.ok).toBe(true);
    if (!guest.ok) return;
    const saved = updateProfile(db, guest.user.id, { displayName: "Amina", timezone: "America/Chicago" });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.user.displayName).toBe("Amina");
    expect(saved.user.timezone).toBe("America/Chicago");
    const rejected = updateProfile(db, guest.user.id, { displayName: "a@b.co", timezone: "America/Chicago" });
    expect(rejected.ok).toBe(false);
  });
});
