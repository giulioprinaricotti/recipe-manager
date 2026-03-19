interface IngredientWithAlternatives {
  name: string;
  quantity?: string | null;
  unit?: string | null;
  optional?: boolean;
  alternativeGroupId?: string | null;
}

/**
 * Format a flat list of ingredients into display strings,
 * grouping alternatives with "or" and marking optional ingredients.
 */
export function formatIngredientLines(
  ingredients: IngredientWithAlternatives[]
): string[] {
  const lines: string[] = [];
  const seen = new Set<string>();

  for (const ing of ingredients) {
    if (ing.alternativeGroupId) {
      if (seen.has(ing.alternativeGroupId)) continue;
      seen.add(ing.alternativeGroupId);
      const alts = ingredients.filter(
        (i) => i.alternativeGroupId === ing.alternativeGroupId
      );
      const names = alts.map((a) => a.name).join(" or ");
      const line = [alts[0].quantity, alts[0].unit, names]
        .filter(Boolean)
        .join(" ");
      lines.push(alts.some((a) => a.optional) ? `${line} (optional)` : line);
    } else {
      const line = [ing.quantity, ing.unit, ing.name]
        .filter(Boolean)
        .join(" ");
      lines.push(ing.optional ? `${line} (optional)` : line);
    }
  }

  return lines;
}
