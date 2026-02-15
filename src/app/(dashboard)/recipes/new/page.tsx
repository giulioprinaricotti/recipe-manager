"use client";

import { useState } from "react";
import { scrapeRecipeAction } from "./actions";
import type { ScrapedRecipe } from "@/lib/recipe-scraper";
import { parseIngredient } from "@/lib/ingredient-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EditRecipeForm } from "./edit-recipe-form";
import type { EditableIngredient, EditableInstruction } from "./types";

export default function NewRecipePage() {
  const [url, setUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<ScrapedRecipe | null>(null);
  const [editIngredients, setEditIngredients] = useState<
    EditableIngredient[] | null
  >(null);
  const [editInstructions, setEditInstructions] = useState<
    EditableInstruction[] | null
  >(null);

  async function handleScrape(e: React.FormEvent) {
    e.preventDefault();
    setScraping(true);
    setError(null);
    setRecipe(null);
    setEditIngredients(null);
    setEditInstructions(null);

    const result = await scrapeRecipeAction(url);

    setScraping(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      const data = result.data;
      setRecipe(data);
      setEditIngredients(
        data.ingredients.map((raw) => {
          const { name, quantity, unit } = parseIngredient(raw);
          return {
            key: crypto.randomUUID(),
            name,
            quantity: quantity ?? "",
            unit: unit ?? "",
          };
        })
      );
      setEditInstructions(
        data.instructions.map((desc) => ({
          key: crypto.randomUUID(),
          description: desc,
        }))
      );
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

      {recipe && editIngredients && editInstructions && (
        <EditRecipeForm
          recipe={recipe}
          initialIngredients={editIngredients}
          initialInstructions={editInstructions}
        />
      )}
    </div>
  );
}
