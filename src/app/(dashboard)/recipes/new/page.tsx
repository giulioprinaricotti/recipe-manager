"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { scrapeRecipeAction, saveScrapedRecipe } from "./actions";
import type { ScrapedRecipe } from "@/lib/recipe-scraper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function NewRecipePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<ScrapedRecipe | null>(null);

  async function handleScrape(e: React.FormEvent) {
    e.preventDefault();
    setScraping(true);
    setError(null);
    setRecipe(null);

    const result = await scrapeRecipeAction(url);

    setScraping(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      setRecipe(result.data);
    }
  }

  async function handleSave() {
    if (!recipe) return;
    setSaving(true);
    setError(null);

    const result = await saveScrapedRecipe(recipe);

    setSaving(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      router.push(`/recipes/${result.id}`);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Add Recipe from URL</h1>

      <form onSubmit={handleScrape} className="flex gap-2 mb-8">
        <div className="flex-1">
          <Label htmlFor="url" className="sr-only">
            Recipe URL
          </Label>
          <Input
            id="url"
            type="url"
            placeholder="https://www.example.com/recipe/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={scraping}>
          {scraping ? "Scraping..." : "Scrape"}
        </Button>
      </form>

      {error && (
        <p className="text-sm text-destructive mb-4">{error}</p>
      )}

      {recipe && (
        <Card>
          <CardHeader>
            <CardTitle>{recipe.title}</CardTitle>
            {recipe.description && (
              <CardDescription className="line-clamp-3">
                {recipe.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {recipe.servings && <span>Serves {recipe.servings}</span>}
              {recipe.prepTime && <span>Prep {recipe.prepTime} min</span>}
              {recipe.cookTime && <span>Cook {recipe.cookTime} min</span>}
            </div>

            {recipe.ingredients.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">
                  {recipe.ingredients.length} ingredients
                </p>
                <ul className="text-sm text-muted-foreground space-y-0.5 list-disc list-inside">
                  {recipe.ingredients.slice(0, 5).map((ing, i) => (
                    <li key={i} className="truncate">{ing}</li>
                  ))}
                  {recipe.ingredients.length > 5 && (
                    <li className="list-none text-xs">
                      +{recipe.ingredients.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            {recipe.instructions.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {recipe.instructions.length} steps
              </p>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Recipe"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
