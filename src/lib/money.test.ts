import { describe, expect, it } from "vitest";
import { formatMinor, multiplyMinor, parseMajorToMinor, sumMinor } from "./money";

describe("money", () => {
  it("parses decimal strings into minor units without binary fractions", () => {
    expect(parseMajorToMinor("10.10")).toBe(1010);
    expect(parseMajorToMinor("0.1")).toBe(10);
    expect(parseMajorToMinor("0.2")).toBe(20);
    expect(sumMinor([parseMajorToMinor("0.1"), parseMajorToMinor("0.2")])).toBe(30);
    expect(parseMajorToMinor("10")).toBe(1000);
    expect(parseMajorToMinor("10.5")).toBe(1050);
  });

  it("rejects values that are not cents", () => {
    expect(() => parseMajorToMinor("10.999")).toThrow(/two cents/);
    expect(() => parseMajorToMinor("1e2")).toThrow(/two cents/);
    expect(() => parseMajorToMinor("-4")).toThrow(/two cents/);
    expect(() => parseMajorToMinor("")).toThrow(/two cents/);
  });

  it("multiplies and formats from integers", () => {
    expect(multiplyMinor(1999, 3)).toBe(5997);
    expect(formatMinor(5997, "USD")).toBe("$59.97");
    expect(formatMinor(500, "CAD")).toBe("CA$5.00");
    expect(formatMinor(0, "EUR")).toBe("€0.00");
  });
});
