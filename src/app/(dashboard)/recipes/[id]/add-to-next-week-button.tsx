"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addRecipeToMealPlan } from "@/app/(dashboard)/meal-plans/[weekId]/actions";

export function AddToNextWeekButton({
  recipeId,
  nextWeekId,
  alreadyPlanned,
}: {
  recipeId: string;
  nextWeekId: string;
  alreadyPlanned: boolean;
}) {
  const [state, setState] = useState<"idle" | "loading" | "added">(
    alreadyPlanned ? "added" : "idle"
  );

  async function handleClick() {
    setState("loading");
    await addRecipeToMealPlan(nextWeekId, recipeId);
    setState("added");
  }

  if (state === "added") {
    return (
      <span className="text-sm text-muted-foreground py-1">
        Planned next week
      </span>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={state === "loading"}
    >
      {state === "loading" ? "Adding…" : "+ Next Week"}
    </Button>
  );
}
