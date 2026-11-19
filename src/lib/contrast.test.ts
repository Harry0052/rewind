import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";

const ink: [number, number, number] = [22, 33, 42];
const paper: [number, number, number] = [246, 247, 247];
const lime: [number, number, number] = [182, 237, 114];
const muted: [number, number, number] = [62, 74, 84];

describe("contrast", () => {
  it("keeps ink readable on paper and on lime", () => {
    expect(contrastRatio(ink, paper)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(ink, lime)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(muted, paper)).toBeGreaterThanOrEqual(4.5);
  });
});
