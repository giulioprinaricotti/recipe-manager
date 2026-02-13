export interface ParsedIngredient {
  name: string;
  quantity: string | null;
  unit: string | null;
}

const UNICODE_FRACTIONS: Record<string, string> = {
  "½": "1/2",
  "⅓": "1/3",
  "⅔": "2/3",
  "¼": "1/4",
  "¾": "3/4",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
};

function normaliseFractions(s: string): string {
  return s.replace(/[½⅓⅔¼¾⅛⅜⅝⅞]/g, (c) => UNICODE_FRACTIONS[c] ?? c);
}

// Number: integer, decimal, fraction, or mixed number (e.g. "1 1/2")
const NUM = `(?:\\d+\\s+\\d+/\\d+|\\d+/\\d+|\\d+(?:[.,]\\d+)?)`;

// Units (order matters — longer tokens first to avoid partial matches)
const UNITS = [
  // imperial (multi-word first)
  "fl\\.?\\s*oz",
  // metric
  "kg",
  "ml",
  "cl",
  "dl",
  // imperial
  "tbsp",
  "tsp",
  "cups?",
  "lbs?",
  "oz",
  "qt",
  "pt",
  "gal",
  // Italian
  "cucchiaini",
  "cucchiai",
  "bicchieri",
  "bicchiere",
  "spicchi",
  "pizzico",
  "fette",
  "rametti",
  // single-letter metric last (to avoid matching "g" inside words)
  "g",
  "l",
].join("|");

// English format: quantity first — "2 tbsp olive oil", "200g pasta", "3 eggs"
const ENGLISH_RE = new RegExp(
  `^(${NUM})\\s*(${UNITS})?(?:\\s+|\\s*$)(.+)?$`,
  "i"
);

// Italian format: name first, trailing quantity/unit — "Paccheri rigati 320 g"
// Also handles "q.b." at the end
const ITALIAN_RE = new RegExp(
  `(?:(q\\.b\\.)|(${NUM})\\s*(${UNITS})?)\\s*$`,
  "i"
);

export function parseIngredient(raw: string): ParsedIngredient {
  const input = normaliseFractions(raw).trim();
  if (!input) return { name: raw.trim(), quantity: null, unit: null };

  const startsWithNumber = /^\d/.test(input);

  if (startsWithNumber) {
    const m = ENGLISH_RE.exec(input);
    if (m && (m[2] || m[3])) {
      return {
        quantity: m[1].trim(),
        unit: m[2]?.trim().toLowerCase() ?? null,
        name: (m[3] ?? "").trim(),
      };
    }
  }

  // Italian format or fallback for strings not starting with a digit
  const m = ITALIAN_RE.exec(input);
  if (m && m.index > 0) {
    const name = input.slice(0, m.index).trim();
    if (m[1]) {
      // q.b. branch
      return { name, quantity: "q.b.", unit: null };
    }
    return {
      name,
      quantity: m[2]?.trim() ?? null,
      unit: m[3]?.trim().toLowerCase() ?? null,
    };
  }

  return { name: input, quantity: null, unit: null };
}
