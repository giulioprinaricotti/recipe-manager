"use client";

import { useTransition } from "react";
import { XIcon } from "lucide-react";
import { removeRecipeFromMealPlan } from "./actions";

export function RemoveRecipeButton({
  weekId,
  recipeId,
}: {
  weekId: string;
  recipeId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleRemove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      await removeRecipeFromMealPlan(weekId, recipeId);
    });
  }

  return (
    <button
      onClick={handleRemove}
      disabled={isPending}
      className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50 cursor-pointer"
      aria-label="Remove from meal plan"
    >
      <XIcon className="size-3.5" />
    </button>
  );
}
