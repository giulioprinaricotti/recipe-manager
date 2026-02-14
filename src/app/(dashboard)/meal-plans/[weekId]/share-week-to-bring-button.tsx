"use client";

import { Button } from "@/components/ui/button";
import { getBringDeeplink, formatIngredientsForBring } from "@/lib/bring";

interface Ingredient {
  name: string;
  quantity: string | null;
  unit: string | null;
}

interface Recipe {
  title: string;
  ingredients: Ingredient[];
}

export function ShareWeekToBringButton({
  weekId,
  userId,
  recipes,
}: {
  weekId: string;
  userId: string;
  recipes: Recipe[];
}) {
  function handleBringClick(e: React.MouseEvent<HTMLAnchorElement>) {
    const schemaUrl = `${window.location.origin}/api/meal-plans/${weekId}/schema?userId=${userId}`;
    e.currentTarget.href = getBringDeeplink(schemaUrl);
  }

  async function handleFallback() {
    const text = recipes
      .map(
        (recipe) =>
          `# ${recipe.title}\n${formatIngredientsForBring(recipe.ingredients)}`
      )
      .join("\n\n");

    await navigator.clipboard.writeText(text);
    alert("Shopping list copied to clipboard!");
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" asChild>
        <a href="#" onClick={handleBringClick}>
          Add to Bring
        </a>
      </Button>
      <Button variant="ghost" size="sm" onClick={handleFallback}>
        Copy list
      </Button>
    </div>
  );
}
