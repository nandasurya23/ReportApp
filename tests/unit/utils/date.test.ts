import {
  formatDateWITA,
  formatISODateToLongID,
  getWeekCountInMonth,
  getWeekOfMonth,
  toISODateOnly,
} from "@/lib/utils/date";

describe("date utils", () => {
  it("formats date to ISO date-only", () => {
    const date = new Date("2026-03-15T12:30:00.000Z");
    expect(toISODateOnly(date)).toBe("2026-03-15");
  });

  it("formats valid ISO date to long Indonesian date", () => {
    expect(formatISODateToLongID("2026-03-15").toLowerCase()).toContain("2026");
  });

  it("returns original string for invalid ISO date", () => {
    expect(formatISODateToLongID("invalid-date")).toBe("invalid-date");
  });

  it("gets week of month from ISO date", () => {
    expect(getWeekOfMonth("2026-03-01")).toBe(1);
    expect(getWeekOfMonth("2026-03-31")).toBe(5);
  });

  it("returns 1 for invalid week-of-month input", () => {
    expect(getWeekOfMonth("invalid-date")).toBe(1);
  });

  it("gets week count for a month", () => {
    expect(getWeekCountInMonth(2026, 2)).toBe(4);
    expect(getWeekCountInMonth(2026, 3)).toBe(5);
  });

  it("formats WITA date string", () => {
    const formatted = formatDateWITA(new Date("2026-03-15T00:00:00.000Z"));
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(0);
  });
});
