interface AggregatableIngredient {
  name: string;
  quantity?: string | null;
  unit?: string | null;
  optional?: boolean;
  alternativeGroupId?: string | null;
}

const UNIT_CANONICAL: Record<string, string> = {
  // grams
  gr: "g",
  grammo: "g",
  grammi: "g",
  // kilos
  kilo: "kg",
  chilo: "kg",
  chili: "kg",
  kilos: "kg",
  kilograms: "kg",
  // liters
  litro: "l",
  litri: "l",
  liter: "l",
  liters: "l",
  // milliliters
  millilitri: "ml",
  millilitro: "ml",
  milliliter: "ml",
  milliliters: "ml",
};

function normalizeName(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

function normalizeUnit(u: string | null | undefined): string {
  if (!u) return "";
  const lo = u.toLowerCase().trim();
  return UNIT_CANONICAL[lo] ?? lo;
}

/**
 * Parse a quantity string into a number.
 * Supports integers, decimals (comma or dot), simple fractions ("1/2"),
 * and mixed numbers ("1 1/2"). Returns null when not parseable
 * (e.g. "q.b.", "a pinch", empty).
 */
function parseNumber(q: string | null | undefined): number | null {
  if (!q) return null;
  const s = q.trim().replace(",", ".");
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    return parseInt(mixed[1], 10) + parseInt(mixed[2], 10) / parseInt(mixed[3], 10);
  }
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) {
    return parseInt(frac[1], 10) / parseInt(frac[2], 10);
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/\.?0+$/, "");
}

/**
 * Aggregate identical ingredients across one or more recipes.
 *
 * Groups by (normalized name + canonical unit). Sums quantities when all
 * group members are numeric; otherwise leaves the group untouched to
 * avoid lossy merges (e.g. "200g pasta" + "q.b. pasta").
 *
 * Items with `alternativeGroupId` are passed through unchanged: alternatives
 * are a recipe-level concept that loses meaning when merged across recipes.
 */
export function aggregateIngredients<T extends AggregatableIngredient>(
  items: T[]
): AggregatableIngredient[] {
  const passthrough: AggregatableIngredient[] = [];
  const aggregable: T[] = [];
  for (const it of items) {
    if (it.alternativeGroupId) passthrough.push(it);
    else aggregable.push(it);
  }

  const groups = new Map<string, T[]>();
  for (const it of aggregable) {
    const key = `${normalizeName(it.name)}|${normalizeUnit(it.unit)}`;
    const existing = groups.get(key);
    if (existing) existing.push(it);
    else groups.set(key, [it]);
  }

  const result: AggregatableIngredient[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }
    const numbers = group.map((g) => parseNumber(g.quantity));
    const allNumeric = numbers.every((n) => n !== null);
    if (allNumeric) {
      const total = numbers.reduce<number>((acc, n) => acc + (n ?? 0), 0);
      const rep = group[0];
      result.push({
        name: rep.name,
        quantity: formatNumber(total),
        unit: rep.unit,
        // optional only if every member is optional
        optional: group.every((g) => g.optional === true),
        alternativeGroupId: null,
      });
    } else {
      // mixed numeric / non-numeric: safe fallback, no merge
      result.push(...group);
    }
  }

  return [...result, ...passthrough];
}
