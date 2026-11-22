import { beforeEach, describe, expect, it, vi } from "vitest";

const upsert = vi.hoisted(() => vi.fn());

vi.mock("./prisma", () => ({
  prisma: { importUsage: { upsert } },
}));

import {
  DAILY_TEXT_IMPORT_LIMIT,
  consumeTextImportQuota,
  usageDay,
} from "./import-usage";

describe("usageDay", () => {
  it("returns UTC midnight for a time late in the UTC day", () => {
    const day = usageDay(new Date("2026-03-10T23:59:59.999Z"));
    expect(day.toISOString()).toBe("2026-03-10T00:00:00.000Z");
  });

  it("returns UTC midnight for a time early in the UTC day", () => {
    const day = usageDay(new Date("2026-03-10T00:00:00.000Z"));
    expect(day.toISOString()).toBe("2026-03-10T00:00:00.000Z");
  });

  it("uses the UTC date even when the local date differs", () => {
    // 00:30 on the 11th in Rome (UTC+1 in winter) is still the 10th in UTC;
    // 22:30 on the 10th in New York (UTC-5) is already the 11th in UTC.
    expect(usageDay(new Date("2026-01-11T00:30:00+01:00")).toISOString()).toBe(
      "2026-01-10T00:00:00.000Z"
    );
    expect(usageDay(new Date("2026-01-10T22:30:00-05:00")).toISOString()).toBe(
      "2026-01-11T00:00:00.000Z"
    );
  });

  it("rolls over at midnight UTC", () => {
    const before = usageDay(new Date("2026-12-31T23:59:59.999Z"));
    const after = usageDay(new Date("2027-01-01T00:00:00.000Z"));
    expect(before.toISOString()).toBe("2026-12-31T00:00:00.000Z");
    expect(after.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});

describe("consumeTextImportQuota", () => {
  const now = new Date("2026-05-04T15:20:00Z");

  beforeEach(() => {
    upsert.mockReset();
  });

  it("upserts one count for the user's UTC day", async () => {
    upsert.mockResolvedValue({ count: 1 });
    await consumeTextImportQuota("user-1", now);

    expect(upsert).toHaveBeenCalledTimes(1);
    const args = upsert.mock.calls[0][0];
    const day = new Date("2026-05-04T00:00:00.000Z");
    expect(args.where).toEqual({ userId_day: { userId: "user-1", day } });
    expect(args.create).toEqual({ userId: "user-1", day, count: 1 });
    expect(args.update).toEqual({ count: { increment: 1 } });
  });

  it("allows the first import", async () => {
    upsert.mockResolvedValue({ count: 1 });
    expect(await consumeTextImportQuota("user-1", now)).toBe(true);
  });

  it("has a daily limit of 20", () => {
    expect(DAILY_TEXT_IMPORT_LIMIT).toBe(20);
  });

  it("allows the import that reaches the limit", async () => {
    upsert.mockResolvedValue({ count: DAILY_TEXT_IMPORT_LIMIT });
    expect(await consumeTextImportQuota("user-1", now)).toBe(true);
  });

  it("refuses the import just past the limit", async () => {
    upsert.mockResolvedValue({ count: DAILY_TEXT_IMPORT_LIMIT + 1 });
    expect(await consumeTextImportQuota("user-1", now)).toBe(false);
  });

  it("defaults to the current time", async () => {
    upsert.mockResolvedValue({ count: 1 });
    await consumeTextImportQuota("user-1");
    const { day } = upsert.mock.calls[0][0].create;
    expect(day).toEqual(usageDay(new Date()));
  });
});
