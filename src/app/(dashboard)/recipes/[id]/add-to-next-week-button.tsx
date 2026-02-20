"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getWeekStart, toWeekId } from "@/lib/weeks";
import { addRecipeToMealPlan } from "@/app/(dashboard)/meal-plans/[weekId]/actions";

export function AddToNextWeekButton({ recipeId }: { recipeId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "added">("idle");

  async function handleClick() {
    setState("loading");
    const now = new Date();
    const currentWeek = getWeekStart(now);
    const nextWeek = new Date(currentWeek);
    nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
    const weekId = toWeekId(nextWeek);

    const result = await addRecipeToMealPlan(weekId, recipeId);

    if ("error" in result) {
      setState("added"); // already added — show same "added" state
    } else {
      setState("added");
    }

    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={state !== "idle"}
    >
      {state === "loading"
        ? "Adding…"
        : state === "added"
          ? "Added!"
          : "+ Next Week"}
    </Button>
  );
}
