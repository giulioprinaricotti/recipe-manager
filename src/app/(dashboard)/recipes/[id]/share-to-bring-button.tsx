"use client";

import { getBringDeeplink, generateShareData } from "@/lib/bring";
import { Button } from "@/components/ui/button";

interface Ingredient {
  name: string;
  quantity: string | null;
  unit: string | null;
}

export function ShareTooBringButton({
  recipeId,
  recipeTitle,
  ingredients,
  servings,
}: {
  recipeId: string;
  recipeTitle: string;
  ingredients: Ingredient[];
  servings: number | null;
}) {
  async function handleShare() {
    // Use our schema.json endpoint so Bring gets exact stored quantities
    const schemaUrl = `${window.location.origin}/api/recipes/${recipeId}/schema.json`;
    window.open(getBringDeeplink(schemaUrl, servings), "_blank");
  }

  async function handleFallback() {
    const shareData = generateShareData(recipeTitle, ingredients);
    if (navigator.canShare?.(shareData)) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(shareData.text ?? "");
      alert("Ingredients copied to clipboard!");
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleShare}>
        Add to Bring
      </Button>
      <Button variant="ghost" size="sm" onClick={handleFallback}>
        Copy list
      </Button>
    </div>
  );
}
