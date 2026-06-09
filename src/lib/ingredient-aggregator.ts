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

/**
 * IT plural head-word -> singular. Explicit map only — no morphological
 * rules — to avoid false merges ("cipolle rosse" vs "cipolla bianca" stay
 * distinct because only the head-word is normalised, not the qualifier).
 *
 * Plural tantum (olive, piselli, fagioli, ceci, lenticchie, spinaci,
 * broccoli, asparagi, pinoli, gamberi, pomodorini): NOT singularised —
 * used as plural in shopping context.
 */
const IT_PLURAL_TO_SINGULAR: Record<string, string> = {
  pomodori: "pomodoro",
  cipolle: "cipolla",
  carote: "carota",
  patate: "patata",
  zucchine: "zucchina",
  melanzane: "melanzana",
  peperoni: "peperone",
  funghi: "fungo",
  limoni: "limone",
  arance: "arancia",
  mele: "mela",
  pere: "pera",
  pesche: "pesca",
  fragole: "fragola",
  mirtilli: "mirtillo",
  lamponi: "lampone",
  banane: "banana",
  spicchi: "spicchio",
  porri: "porro",
  carciofi: "carciofo",
  cetrioli: "cetriolo",
  ravanelli: "ravanello",
  cipollotti: "cipollotto",
  noci: "noce",
  nocciole: "nocciola",
  mandorle: "mandorla",
  pistacchi: "pistacchio",
  fichi: "fico",
  sgombri: "sgombro",
  cozze: "cozza",
  vongole: "vongola",
  calamari: "calamaro",
  salsicce: "salsiccia",
  cosce: "coscia",
  uova: "uovo",
  jalapeños: "jalapeño",
  peperoncini: "peperoncino",
};

// Qualifiers that don't change the shopping item — stripped from the KEY
// so "basilico fresco" merges with plain "basilico". They are NOT removed
// from the displayed name (which comes from the first member of the group).
const QUALIFIERS_TO_STRIP = new Set<string>([
  // IT
  "fresco", "fresca", "freschi", "fresche",
  "secco", "secca", "secchi", "secche",
  "essiccato", "essiccata", "essiccati", "essiccate",
  "tritato", "tritata", "tritati", "tritate",
  "grattugiato", "grattugiata", "grattugiati", "grattugiate",
  "pelato", "pelata", "pelati", "pelate",
  "sfilettato", "sfilettata", "sfilettati", "sfilettate",
  "dissalato", "dissalata", "dissalati", "dissalate",
  "snocciolato", "snocciolata", "snocciolati", "snocciolate",
  "denocciolato", "denocciolata", "denocciolati", "denocciolate",
  // EN
  "fresh", "dried", "chopped", "sliced", "minced", "grated",
  "crushed", "peeled", "halved", "ground", "frozen",
  "raw", "cooked", "fried", "roasted", "toasted",
  "fine", "finely", "roughly", "thinly", "thickly",
]);

function stripParentheticals(s: string): string {
  return s.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
}

function stripTrailingClauses(s: string): string {
  // Drop everything after the first comma — recipe annotations
  // ("onion, finely chopped", "lemon, zested") are noise for shopping.
  const i = s.indexOf(",");
  if (i === -1) return s;
  return s.slice(0, i).trim();
}

function stripQualifiers(s: string): string {
  return s
    .split(" ")
    .filter((tok) => tok && !QUALIFIERS_TO_STRIP.has(tok))
    .join(" ");
}

function singularizeHead(s: string): string {
  if (!s) return s;
  const parts = s.split(" ");
  const head = parts[0];
  const sing = IT_PLURAL_TO_SINGULAR[head];
  if (sing) parts[0] = sing;
  return parts.join(" ");
}

/**
 * Produce the aggregation KEY name from a raw ingredient name.
 *
 * Pipeline (each step is conservative — only collapses items the user
 * would buy as one):
 *   1. lowercase + whitespace fold;
 *   2. drop parentheticals  "( ... )";
 *   3. drop trailing clauses after first ",";
 *   4. strip shopping-irrelevant qualifiers (fresco, fresh, tritato, ...);
 *   5. singularize the HEAD-word only via explicit map (preserves
 *      modifiers — "cipolle rosse" -> "cipolla rossa", but NOT merged
 *      with "cipolla bianca").
 *
 * Exported for tests; not consumed elsewhere.
 */
export function normalizeName(s: string): string {
  let out = s.toLowerCase().trim().replace(/\s+/g, " ");
  out = stripParentheticals(out);
  out = stripTrailingClauses(out);
  out = stripQualifiers(out);
  out = singularizeHead(out);
  return out.trim();
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
