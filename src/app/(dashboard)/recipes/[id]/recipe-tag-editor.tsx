"use client";

import { useState, useTransition } from "react";
import { RECIPE_TAGS } from "@/lib/tags";
import { updateRecipeTags } from "./actions";
import { cn } from "@/lib/utils";

export function RecipeTagEditor({
  recipeId,
  initialTags,
  isOwn,
}: {
  recipeId: string;
  initialTags: string[];
  isOwn: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialTags));
  const [isPending, startTransition] = useTransition();

  function toggle(slug: string) {
    const next = new Set(selected);
    if (next.has(slug)) {
      next.delete(slug);
    } else {
      next.add(slug);
    }
    setSelected(next);

    startTransition(async () => {
      await updateRecipeTags(recipeId, Array.from(next));
    });
  }

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        Tags
      </p>
      <div className="flex flex-wrap gap-2">
        {RECIPE_TAGS.map((tag) => {
          const active = selected.has(tag.slug);
          return (
            <button
              key={tag.slug}
              onClick={() => isOwn && toggle(tag.slug)}
              disabled={isPending || !isOwn}
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity",
                "border cursor-pointer disabled:opacity-50",
                active
                  ? tag.colorClasses
                  : "bg-background text-muted-foreground border-border hover:border-foreground"
              )}
            >
              {tag.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
