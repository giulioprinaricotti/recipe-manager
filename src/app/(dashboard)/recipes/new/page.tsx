"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { scrapeRecipeAction, saveEditedRecipe } from "./actions";
import type { ScrapedRecipe } from "@/lib/recipe-scraper";
import { parseIngredient } from "@/lib/ingredient-parser";
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
import { EditRecipeForm } from "./edit-recipe-form";
import { ManualRecipeForm } from "./manual-recipe-form";
import type {
  EditableIngredient,
  EditableInstruction,
  RecipeContentData,
} from "./types";

type Mode = "url" | "manual";

export default function NewRecipePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("url");

  // URL-scrape state
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

  const savedIdRef = useRef<string | null>(null);

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

  async function handleSave(
    data: RecipeContentData
  ): Promise<{ error: string } | void> {
    if (!recipe) return { error: "No recipe data" };

    const result = await saveEditedRecipe({
      title: recipe.title,
      description: recipe.description,
      sourceUrl: recipe.sourceUrl,
      imageUrl: recipe.imageUrl,
      servings: recipe.servings,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      ...data,
    });

    if ("error" in result) {
      return { error: result.error };
    }

    savedIdRef.current = result.id;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Add Recipe</h1>

      <div className="flex gap-2 mb-8">
        <Button
          variant={mode === "url" ? "default" : "outline"}
          onClick={() => setMode("url")}
        >
          From URL
        </Button>
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          onClick={() => setMode("manual")}
        >
          From Scratch
        </Button>
      </div>

      {mode === "url" && (
        <>
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
            <Card>
              <CardHeader>
                <CardTitle>{recipe.title}</CardTitle>
                {recipe.description && (
                  <CardDescription className="line-clamp-3">
                    {recipe.description}
                  </CardDescription>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-1">
                  {recipe.servings && <span>Serves {recipe.servings}</span>}
                  {recipe.prepTime && <span>Prep {recipe.prepTime} min</span>}
                  {recipe.cookTime && <span>Cook {recipe.cookTime} min</span>}
                </div>
              </CardHeader>
              <CardContent>
                <EditRecipeForm
                  initialIngredients={editIngredients}
                  initialInstructions={editInstructions}
                  onSave={handleSave}
                  onSuccess={() => router.push(`/recipes/${savedIdRef.current}`)}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}

      {mode === "manual" && <ManualRecipeForm />}
    </div>
  );
}
