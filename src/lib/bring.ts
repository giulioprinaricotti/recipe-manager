interface BringIngredient {
  name: string;
  quantity?: string | null;
  unit?: string | null;
}

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

export function generateShareData(
  recipeTitle: string,
  ingredients: BringIngredient[]
): ShareData {
  const text = formatIngredientsForBring(ingredients);
  return {
    title: `Shopping list for ${recipeTitle}`,
    text,
  };
}
