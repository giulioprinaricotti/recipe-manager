import { prisma } from "./prisma";

/** Paid text imports one user can start per UTC day. */
export const DAILY_TEXT_IMPORT_LIMIT = 20;

export function usageDay(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Counts one import against the user's daily allowance and says whether it may
 * run. The increment happens before the paid call and in a single statement,
 * so parallel requests cannot slip past the limit.
 */
export async function consumeTextImportQuota(
  userId: string,
  now: Date = new Date()
): Promise<boolean> {
  const day = usageDay(now);
  const usage = await prisma.importUsage.upsert({
    where: { userId_day: { userId, day } },
    create: { userId, day, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });
  return usage.count <= DAILY_TEXT_IMPORT_LIMIT;
}
