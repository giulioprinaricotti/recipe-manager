"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { removeLegacyFavourite } from "./[id]/favourite-actions";

interface FavouriteButtonProps {
  recipeId: string;
}

/**
 * Only rendered for legacy cross-user Favourites (granted before recipes
 * became private). Lets the recipient remove the shared recipe from their
 * list. No "add" path exists anymore — share via invite link clones instead.
 */
export function FavouriteButton({ recipeId }: FavouriteButtonProps) {
  const [hidden, setHidden] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (hidden) return null;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Remove this shared recipe from your list?")) return;
    setHidden(true);
    startTransition(async () => {
      await removeLegacyFavourite(recipeId);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "p-1.5 rounded-full bg-background/80 backdrop-blur transition-colors",
        "text-muted-foreground hover:text-destructive hover:bg-background"
      )}
      aria-label="Remove from my list"
      title="Remove from my list"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
