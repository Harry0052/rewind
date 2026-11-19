import { describe, expect, it } from "vitest";
import { sameOrigin } from "./http";

describe("sameOrigin", () => {
  it("accepts a matching origin and rejects a foreign one", () => {
    const ok = new Request("http://localhost:3000/api/settings", {
      headers: { origin: "http://localhost:3000", host: "localhost:3000" },
    });
    const bad = new Request("http://localhost:3000/api/settings", {
      headers: { origin: "http://evil.example", host: "localhost:3000" },
    });
    expect(sameOrigin(ok)).toBe(true);
    expect(sameOrigin(bad)).toBe(false);
  });
});
