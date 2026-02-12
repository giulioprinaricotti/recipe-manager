"use client";

import { getBringDeeplink, generateShareData } from "@/lib/bring";
import { Button } from "@/components/ui/button";

interface Ingredient {
  name: string;
  quantity: string | null;
  unit: string | null;
}

export function ShareTooBringButton({
  recipeTitle,
  ingredients,
  sourceUrl,
  servings,
}: {
  recipeTitle: string;
  ingredients: Ingredient[];
  sourceUrl: string | null;
  servings: number | null;
}) {
  async function handleShare() {
    if (sourceUrl) {
      // Use the official Bring deeplink API — Bring crawls the source URL
      // for schema.org/Recipe JSON-LD markup
      window.open(getBringDeeplink(sourceUrl, servings), "_blank");
      return;
    }

    // Fallback: no source URL, share ingredients as plain text
    const shareData = generateShareData(recipeTitle, ingredients);
    if (navigator.canShare?.(shareData)) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(shareData.text ?? "");
      alert("Ingredients copied to clipboard!");
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      Add to Bring
    </Button>
  );
}
