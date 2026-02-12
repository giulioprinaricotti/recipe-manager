"use client";

import { generateShareData } from "@/lib/bring";
import { Button } from "@/components/ui/button";

interface Ingredient {
  name: string;
  quantity: string | null;
  unit: string | null;
}

export function ShareTooBringButton({
  recipeTitle,
  ingredients,
}: {
  recipeTitle: string;
  ingredients: Ingredient[];
}) {
  async function handleShare() {
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
      Share to Bring
    </Button>
  );
}
