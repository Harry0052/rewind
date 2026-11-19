import { describe, expect, it } from "vitest";
import { addCalendarDays, calendarDateInZone, isIsoDate, isTimeZone } from "./time";

describe("calendar dates", () => {
  it("uses the merchant timezone at the New York midnight boundary", () => {
    const instant = new Date("2026-03-31T03:30:00Z");
    expect(calendarDateInZone(instant, "America/New_York")).toBe("2026-03-30");
    expect(calendarDateInZone(instant, "UTC")).toBe("2026-03-31");
  });

  it("adds calendar days across month and leap-day boundaries", () => {
    expect(addCalendarDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addCalendarDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addCalendarDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(isIsoDate("2026-02-31")).toBe(false);
  });

  it("accepts IANA timezones only", () => {
    expect(isTimeZone("America/Chicago")).toBe(true);
    expect(isTimeZone("Not/Azone")).toBe(false);
    expect(isTimeZone("")).toBe(false);
  });
});
