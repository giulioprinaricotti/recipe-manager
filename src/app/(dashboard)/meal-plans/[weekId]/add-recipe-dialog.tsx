"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { PlusIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TagBadge } from "@/components/tag-badge";
import { addRecipeToMealPlan, getRecipesForPicker } from "./actions";

type PickerRecipe = {
  id: string;
  title: string;
  imageUrl: string | null;
  tags: string[];
  alreadyAdded: boolean;
};

export function AddRecipeDialog({ weekId }: { weekId: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [recipes, setRecipes] = useState<PickerRecipe[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoadingRecipes, startLoadTransition] = useTransition();

  const loadRecipes = useCallback(
    (searchTerm: string) => {
      startLoadTransition(async () => {
        const result = await getRecipesForPicker(
          weekId,
          searchTerm || undefined
        );
        setRecipes(result.recipes);
      });
    },
    [weekId]
  );

  useEffect(() => {
    if (!open) return;

    const timeout = setTimeout(() => loadRecipes(search), search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [open, search, loadRecipes]);

  function handleAdd(recipeId: string) {
    setAddingId(recipeId);
    startTransition(async () => {
      const result = await addRecipeToMealPlan(weekId, recipeId);
      if ("success" in result) {
        setRecipes((prev) =>
          prev.map((r) =>
            r.id === recipeId ? { ...r, alreadyAdded: true } : r
          )
        );
      }
      setAddingId(null);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="size-4 mr-1.5" />
          Add Recipe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Recipe</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="overflow-y-auto max-h-[60vh] -mx-1 px-1">
          {isLoadingRecipes ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Loading...
            </p>
          ) : recipes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {search ? "No recipes match your search." : "No recipes yet."}
            </p>
          ) : (
            <div className="space-y-1">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50"
                >
                  {recipe.imageUrl ? (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className="w-10 h-10 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground shrink-0">
                      {recipe.title.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {recipe.title}
                    </p>
                    {recipe.tags.length > 0 && (
                      <div className="flex gap-1 mt-0.5">
                        {recipe.tags.slice(0, 3).map((slug) => (
                          <TagBadge key={slug} slug={slug} />
                        ))}
                      </div>
                    )}
                  </div>
                  {recipe.alreadyAdded ? (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <CheckIcon className="size-3.5" />
                      Added
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAdd(recipe.id)}
                      disabled={isPending && addingId === recipe.id}
                      className="shrink-0"
                    >
                      {isPending && addingId === recipe.id
                        ? "Adding..."
                        : "Add"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
