"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleFavourite } from "./[id]/favourite-actions";

interface FavouriteButtonProps {
  recipeId: string;
  isFavourited: boolean;
  isOwn: boolean;
}

export function FavouriteButton({
  recipeId,
  isFavourited,
  isOwn,
}: FavouriteButtonProps) {
  const [optimistic, setOptimistic] = useState(isFavourited);

  if (isOwn) {
    return (
      <span className="p-1.5 text-rose-500">
        <Heart className="h-4 w-4 fill-current" />
      </span>
    );
  }

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !optimistic;
    setOptimistic(next);
    await toggleFavourite(recipeId, optimistic);
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "p-1.5 rounded-full transition-colors hover:bg-background/80",
        optimistic ? "text-rose-500" : "text-muted-foreground hover:text-rose-400"
      )}
      aria-label={optimistic ? "Remove from favourites" : "Add to favourites"}
    >
      <Heart className={cn("h-4 w-4", optimistic && "fill-current")} />
    </button>
  );
}
