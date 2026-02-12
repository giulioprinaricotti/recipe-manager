const BRING_DEEPLINK_API = "https://api.getbring.com/rest/bringrecipes/deeplink";

interface BringIngredient {
  name: string;
  quantity?: string | null;
  unit?: string | null;
}

/**
 * Generate a Bring! deeplink URL.
 * Pass a .json schema URL for exact quantities, or a web page URL for HTML scraping.
 */
export function getBringDeeplink(
  recipeUrl: string,
  servings?: number | null
): string {
  const params = new URLSearchParams({
    url: recipeUrl,
    source: "web",
    ...(servings && {
      baseQuantity: String(servings),
      requestedQuantity: String(servings),
    }),
  });
  return `${BRING_DEEPLINK_API}?${params.toString()}`;
}

/**
 * Format ingredients as plain text for clipboard fallback.
 */
export function formatIngredientsForBring(
  ingredients: BringIngredient[]
): string {
  return ingredients
    .map((ing) => {
      const parts = [ing.quantity, ing.unit, ing.name].filter(Boolean);
      return parts.join(" ");
    })
    .join("\n");
}

/**
 * Generate ShareData for Web Share API fallback (no sourceUrl).
 */
export function generateShareData(
  recipeTitle: string,
  ingredients: BringIngredient[]
): ShareData {
  return {
    title: `Shopping list for ${recipeTitle}`,
    text: formatIngredientsForBring(ingredients),
  };
}
