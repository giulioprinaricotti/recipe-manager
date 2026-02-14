import { describe, it, expect } from "vitest";
import {
  getWeekStart,
  formatWeekLabel,
  generateWeekRange,
  toWeekId,
  fromWeekId,
} from "./weeks";

describe("getWeekStart", () => {
  it("returns Monday for a Wednesday", () => {
    // Wed Feb 18, 2026
    const wed = new Date(Date.UTC(2026, 1, 18));
    const result = getWeekStart(wed);
    expect(result.toISOString()).toBe("2026-02-16T00:00:00.000Z");
  });

  it("returns same day for a Monday", () => {
    const mon = new Date(Date.UTC(2026, 1, 16));
    const result = getWeekStart(mon);
    expect(result.toISOString()).toBe("2026-02-16T00:00:00.000Z");
  });

  it("returns previous Monday for a Sunday", () => {
    // Sun Feb 22, 2026
    const sun = new Date(Date.UTC(2026, 1, 22));
    const result = getWeekStart(sun);
    expect(result.toISOString()).toBe("2026-02-16T00:00:00.000Z");
  });

  it("handles year boundary (Sun Jan 3, 2027 → Mon Dec 28, 2026)", () => {
    const sun = new Date(Date.UTC(2027, 0, 3));
    const result = getWeekStart(sun);
    expect(result.toISOString()).toBe("2026-12-28T00:00:00.000Z");
  });
});

describe("toWeekId / fromWeekId", () => {
  it("round-trips correctly", () => {
    const mon = new Date(Date.UTC(2026, 1, 16));
    const weekId = toWeekId(mon);
    expect(weekId).toBe("2026-W08");
    const back = fromWeekId(weekId);
    expect(back.toISOString()).toBe("2026-02-16T00:00:00.000Z");
  });

  it("handles week 1", () => {
    // Mon Dec 29, 2025 is ISO week 1 of 2026
    const mon = new Date(Date.UTC(2025, 11, 29));
    const weekId = toWeekId(mon);
    expect(weekId).toBe("2026-W01");
    expect(fromWeekId(weekId).toISOString()).toBe("2025-12-29T00:00:00.000Z");
  });

  it("handles last week of year", () => {
    // Mon Dec 28, 2026 is ISO week 53 of 2026? Let's check — actually 2026-12-28 is week 53
    const mon = new Date(Date.UTC(2026, 11, 28));
    const weekId = toWeekId(mon);
    const back = fromWeekId(weekId);
    expect(back.toISOString()).toBe(mon.toISOString());
  });

  it("throws on invalid format", () => {
    expect(() => fromWeekId("2026-08")).toThrow("Invalid weekId");
    expect(() => fromWeekId("foo")).toThrow("Invalid weekId");
  });
});

describe("formatWeekLabel", () => {
  const today = new Date(Date.UTC(2026, 1, 18)); // Wed Feb 18

  it("labels current week", () => {
    const mon = new Date(Date.UTC(2026, 1, 16));
    expect(formatWeekLabel(mon, today)).toBe("This Week (Feb 16 – Feb 22)");
  });

  it("labels next week", () => {
    const mon = new Date(Date.UTC(2026, 1, 23));
    expect(formatWeekLabel(mon, today)).toBe("Next Week (Feb 23 – Mar 1)");
  });

  it("shows plain range for other weeks", () => {
    const mon = new Date(Date.UTC(2026, 1, 9));
    expect(formatWeekLabel(mon, today)).toBe("Feb 9 – Feb 15");
  });
});

describe("generateWeekRange", () => {
  it("generates correct number of weeks", () => {
    const today = new Date(Date.UTC(2026, 1, 18));
    const weeks = generateWeekRange(2, 1, today);
    expect(weeks).toHaveLength(4); // 2 past + current + 1 future
  });

  it("includes current week", () => {
    const today = new Date(Date.UTC(2026, 1, 18));
    const weeks = generateWeekRange(1, 1, today);
    const currentMonday = "2026-02-16T00:00:00.000Z";
    expect(weeks.map((w) => w.toISOString())).toContain(currentMonday);
  });

  it("weeks are in chronological order", () => {
    const today = new Date(Date.UTC(2026, 1, 18));
    const weeks = generateWeekRange(3, 3, today);
    for (let i = 1; i < weeks.length; i++) {
      expect(weeks[i].getTime()).toBeGreaterThan(weeks[i - 1].getTime());
    }
  });
});
