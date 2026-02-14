/**
 * Get the Monday 00:00 UTC for the week containing the given date.
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

/**
 * Format a weekStart date as a human-readable label.
 * Examples: "This Week (Feb 16 – 22)", "Next Week (Feb 23 – Mar 1)", "Feb 9 – 15"
 */
export function formatWeekLabel(weekStart: Date, today?: Date): string {
  const ref = today ?? new Date();
  const currentWeek = getWeekStart(ref);
  const nextWeek = new Date(currentWeek);
  nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);

  const sunday = new Date(weekStart);
  sunday.setUTCDate(sunday.getUTCDate() + 6);

  const monStr = formatShortDate(weekStart);
  const sunStr = formatShortDate(sunday);
  const range = `${monStr} – ${sunStr}`;

  if (weekStart.getTime() === currentWeek.getTime()) {
    return `This Week (${range})`;
  }
  if (weekStart.getTime() === nextWeek.getTime()) {
    return `Next Week (${range})`;
  }
  return range;
}

/**
 * Format a date as "Mon D" (e.g. "Feb 16") or "Mon D, YYYY" if different year.
 */
function formatShortDate(date: Date, refYear?: number): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[date.getUTCMonth()];
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  const currentYear = refYear ?? new Date().getUTCFullYear();
  if (year !== currentYear) {
    return `${month} ${day}, ${year}`;
  }
  return `${month} ${day}`;
}

/**
 * Generate an array of weekStart dates: pastWeeks in the past through futureWeeks in the future.
 */
export function generateWeekRange(
  pastWeeks: number,
  futureWeeks: number,
  today?: Date
): Date[] {
  const ref = today ?? new Date();
  const currentWeek = getWeekStart(ref);
  const weeks: Date[] = [];

  for (let i = -pastWeeks; i <= futureWeeks; i++) {
    const w = new Date(currentWeek);
    w.setUTCDate(w.getUTCDate() + i * 7);
    weeks.push(w);
  }

  return weeks;
}

/**
 * Convert a weekStart date to a URL-safe ISO week string: "2026-W08".
 */
export function toWeekId(weekStart: Date): string {
  // ISO week number: the week containing the year's first Thursday
  const d = new Date(
    Date.UTC(
      weekStart.getUTCFullYear(),
      weekStart.getUTCMonth(),
      weekStart.getUTCDate()
    )
  );
  // Set to nearest Thursday (current date + 4 - current day number, with Sunday as 7)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/**
 * Parse a weekId string ("2026-W08") back to a weekStart Date (Monday UTC).
 */
export function fromWeekId(weekId: string): Date {
  const match = weekId.match(/^(\d{4})-W(\d{2})$/);
  if (!match) throw new Error(`Invalid weekId: ${weekId}`);

  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);

  // Jan 4th is always in ISO week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  // Monday of week 1
  const week1Monday = new Date(jan4);
  const day = jan4.getUTCDay() || 7; // 1=Mon...7=Sun
  week1Monday.setUTCDate(jan4.getUTCDate() - (day - 1));

  // Add (week - 1) * 7 days
  const result = new Date(week1Monday);
  result.setUTCDate(result.getUTCDate() + (week - 1) * 7);
  return result;
}
