"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  scrapeRecipeAction,
  extractRecipeFromTextAction,
  saveEditedRecipe,
} from "./actions";
import type { ScrapedRecipe } from "@/lib/recipe-scraper";
import type { ExtractedRecipe } from "@/lib/recipe-text-extractor";
import { parseIngredient } from "@/lib/ingredient-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagBadge } from "@/components/tag-badge";
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

type Mode = "url" | "text" | "manual";

// Draft shared by the URL and text flows: text drafts have no source URL or image.
type RecipeDraft = Omit<ScrapedRecipe, "sourceUrl" | "imageUrl"> & {
  sourceUrl?: string;
  imageUrl?: string;
  tags?: ExtractedRecipe["tags"];
};

export function NewRecipeClient({
  textImportEnabled,
  maxTextLength,
}: {
  textImportEnabled: boolean;
  maxTextLength: number;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("url");

  // URL-scrape state
  const [url, setUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [recipe, setRecipe] = useState<RecipeDraft | null>(null);
  const [editIngredients, setEditIngredients] = useState<
    EditableIngredient[] | null
  >(null);
  const [editInstructions, setEditInstructions] = useState<
    EditableInstruction[] | null
  >(null);

  const savedIdRef = useRef<string | null>(null);

  function clearDraft() {
    setError(null);
    setRecipe(null);
    setEditIngredients(null);
    setEditInstructions(null);
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    clearDraft();
    setMode(next);
  }

  function loadDraft(data: RecipeDraft) {
    setRecipe(data);
    setEditIngredients(
      data.ingredients.map((raw) => {
        const { name, quantity, unit } = parseIngredient(raw);
        return {
          key: crypto.randomUUID(),
          name,
          quantity: quantity ?? "",
          unit: unit ?? "",
          optional: false,
          alternativeGroupId: null,
        };
      }),
    );
    setEditInstructions(
      data.instructions.map((desc) => ({
        key: crypto.randomUUID(),
        description: desc,
      })),
    );
  }

  async function handleScrape(e: React.FormEvent) {
    e.preventDefault();
    setScraping(true);
    clearDraft();

    const result = await scrapeRecipeAction(url);

    setScraping(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      loadDraft(result.data);
    }
  }

  async function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    setExtracting(true);
    clearDraft();

    const result = await extractRecipeFromTextAction(text);

    setExtracting(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      loadDraft(result.data);
    }
  }

  async function handleSave(
    data: RecipeContentData,
  ): Promise<{ error: string } | void> {
    if (!recipe) return { error: "No recipe data" };

    const result = await saveEditedRecipe({
      title: recipe.title,
      description: recipe.description,
      sourceUrl: mode === "url" ? recipe.sourceUrl : undefined,
      imageUrl: recipe.imageUrl,
      tags: recipe.tags,
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
          onClick={() => switchMode("url")}
        >
          From URL
        </Button>
        {textImportEnabled && (
          <Button
            variant={mode === "text" ? "default" : "outline"}
            onClick={() => switchMode("text")}
          >
            From text
          </Button>
        )}
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          onClick={() => switchMode("manual")}
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
                type="text"
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
        </>
      )}

      {mode === "text" && textImportEnabled && (
        <form onSubmit={handleExtract} className="space-y-2 mb-8">
          <Label htmlFor="recipe-text">Recipe text</Label>
          <Textarea
            id="recipe-text"
            placeholder="Paste an Instagram caption, a message or a note with a recipe..."
            className="min-h-40"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={maxTextLength}
            required
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {text.length} / {maxTextLength}
            </span>
            <Button type="submit" disabled={extracting}>
              {extracting ? "Extracting..." : "Extract recipe"}
            </Button>
          </div>
        </form>
      )}

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}

      {mode !== "manual" && recipe && editIngredients && editInstructions && (
        <Card>
          <CardHeader>
            <CardTitle>{recipe.title}</CardTitle>
            {recipe.description && (
              <CardDescription className="line-clamp-3">
                {recipe.description}
              </CardDescription>
            )}
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {recipe.tags.map((slug) => (
                  <TagBadge key={slug} slug={slug} />
                ))}
              </div>
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

      {mode === "manual" && <ManualRecipeForm />}
    </div>
  );
}
