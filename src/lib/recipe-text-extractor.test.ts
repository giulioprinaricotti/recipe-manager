import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAX_RECIPE_TEXT_LENGTH,
  extractRecipeFromText,
  isTextImportEnabled,
} from "./recipe-text-extractor";
import { RECIPE_TAGS } from "./tags";

function modelOutput(overrides: Record<string, unknown> = {}) {
  return {
    containsRecipe: true,
    title: "Pasta al pomodoro",
    description: null,
    servings: null,
    prepTimeMinutes: null,
    cookTimeMinutes: null,
    ingredients: ["200 g pasta"],
    instructions: ["Cuoci la pasta"],
    tags: [],
    ...overrides,
  };
}

function fakeModel(output: unknown) {
  return vi.fn(async (_text: string) => output);
}

describe("extractRecipeFromText", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("successful extraction", () => {
    it("maps the model output to a recipe", async () => {
      const tag = RECIPE_TAGS[0].slug;
      const result = await extractRecipeFromText(
        "some text",
        fakeModel(
          modelOutput({
            description: "Un classico",
            servings: 4,
            prepTimeMinutes: 10,
            cookTimeMinutes: 20,
            ingredients: ["200 g pasta", "2 pomodori"],
            instructions: ["Taglia", "Cuoci"],
            tags: [tag],
          })
        )
      );
      expect(result).toEqual({
        ok: true,
        recipe: {
          title: "Pasta al pomodoro",
          description: "Un classico",
          servings: 4,
          prepTime: 10,
          cookTime: 20,
          ingredients: ["200 g pasta", "2 pomodori"],
          instructions: ["Taglia", "Cuoci"],
          tags: [tag],
        },
      });
    });

    it("turns null optional fields into undefined", async () => {
      const result = await extractRecipeFromText("t", fakeModel(modelOutput()));
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.recipe.description).toBeUndefined();
      expect(result.recipe.servings).toBeUndefined();
      expect(result.recipe.prepTime).toBeUndefined();
      expect(result.recipe.cookTime).toBeUndefined();
    });

    it("turns zero and negative numbers into undefined", async () => {
      const result = await extractRecipeFromText(
        "t",
        fakeModel(modelOutput({ servings: 0, prepTimeMinutes: -5, cookTimeMinutes: 0 }))
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.recipe.servings).toBeUndefined();
      expect(result.recipe.prepTime).toBeUndefined();
      expect(result.recipe.cookTime).toBeUndefined();
    });

    it("drops blank lines and trims the rest", async () => {
      const result = await extractRecipeFromText(
        "t",
        fakeModel(
          modelOutput({
            ingredients: ["  200 g pasta  ", "", "   ", "2 uova"],
            instructions: ["", "  Cuoci  ", "\n"],
          })
        )
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.recipe.ingredients).toEqual(["200 g pasta", "2 uova"]);
      expect(result.recipe.instructions).toEqual(["Cuoci"]);
    });

    it("de-duplicates tags", async () => {
      const [a, b] = RECIPE_TAGS.map((t) => t.slug);
      const result = await extractRecipeFromText(
        "t",
        fakeModel(modelOutput({ tags: [a, b, a, b, a] }))
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.recipe.tags).toEqual([a, b]);
    });

    it.each([null, "", "   "])("falls back to a default title for %j", async (title) => {
      const result = await extractRecipeFromText("t", fakeModel(modelOutput({ title })));
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.recipe.title).toBe("Untitled Recipe");
    });

    it("accepts a recipe with only instructions", async () => {
      const result = await extractRecipeFromText(
        "t",
        fakeModel(modelOutput({ ingredients: [] }))
      );
      expect(result.ok).toBe(true);
    });

    it("accepts a recipe with only ingredients", async () => {
      const result = await extractRecipeFromText(
        "t",
        fakeModel(modelOutput({ instructions: [] }))
      );
      expect(result.ok).toBe(true);
    });
  });

  describe("no recipe", () => {
    it("reports no_recipe when containsRecipe is false", async () => {
      const result = await extractRecipeFromText(
        "t",
        fakeModel(modelOutput({ containsRecipe: false }))
      );
      expect(result).toEqual({ ok: false, reason: "no_recipe" });
    });

    it("reports no_recipe when both lists are empty", async () => {
      const result = await extractRecipeFromText(
        "t",
        fakeModel(modelOutput({ ingredients: [], instructions: [] }))
      );
      expect(result).toEqual({ ok: false, reason: "no_recipe" });
    });

    it("reports no_recipe when both lists hold only blank strings", async () => {
      const result = await extractRecipeFromText(
        "t",
        fakeModel(modelOutput({ ingredients: ["", "  "], instructions: ["\n"] }))
      );
      expect(result).toEqual({ ok: false, reason: "no_recipe" });
    });
  });

  describe("invalid model output", () => {
    const cases: [string, unknown][] = [
      ["null", null],
      ["a string", "recipe"],
      ["an empty object", {}],
      ["a missing field", (() => {
        const { ingredients: _omit, ...rest } = modelOutput();
        return rest;
      })()],
      ["a wrong type", modelOutput({ servings: "four" })],
      ["a non-integer number", modelOutput({ servings: 2.5 })],
      ["ingredients that are not an array", modelOutput({ ingredients: "flour" })],
      ["a tag outside RECIPE_TAGS", modelOutput({ tags: ["not-a-real-tag"] })],
    ];

    it.each(cases)("reports invalid_response for %s", async (_name, output) => {
      const result = await extractRecipeFromText("t", fakeModel(output));
      expect(result).toEqual({ ok: false, reason: "invalid_response" });
    });
  });

  describe("model failure", () => {
    it("reports unavailable and logs when the model call throws", async () => {
      const result = await extractRecipeFromText("t", async () => {
        throw new Error("boom");
      });
      expect(result).toEqual({ ok: false, reason: "unavailable" });
      expect(console.error).toHaveBeenCalledTimes(1);
    });
  });

  describe("input validation", () => {
    it.each(["", "   ", "\n\t "])("reports empty for %j without calling the model", async (text) => {
      const model = fakeModel(modelOutput());
      const result = await extractRecipeFromText(text, model);
      expect(result).toEqual({ ok: false, reason: "empty" });
      expect(model).not.toHaveBeenCalled();
    });

    it("reports too_long above the limit without calling the model", async () => {
      const model = fakeModel(modelOutput());
      const result = await extractRecipeFromText(
        "a".repeat(MAX_RECIPE_TEXT_LENGTH + 1),
        model
      );
      expect(result).toEqual({ ok: false, reason: "too_long" });
      expect(model).not.toHaveBeenCalled();
    });

    it("accepts text of exactly the limit", async () => {
      const model = fakeModel(modelOutput());
      const result = await extractRecipeFromText("a".repeat(MAX_RECIPE_TEXT_LENGTH), model);
      expect(result.ok).toBe(true);
      expect(model).toHaveBeenCalledTimes(1);
    });

    it("measures the limit on trimmed text", async () => {
      const model = fakeModel(modelOutput());
      const padded = `  ${"a".repeat(MAX_RECIPE_TEXT_LENGTH)}  `;
      const result = await extractRecipeFromText(padded, model);
      expect(result.ok).toBe(true);
    });

    it("passes the trimmed text to the model", async () => {
      const model = fakeModel(modelOutput());
      await extractRecipeFromText("  \n 200 g farina \n ", model);
      expect(model).toHaveBeenCalledWith("200 g farina");
    });
  });
});

describe("isTextImportEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is false when the key is unset", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", undefined);
    expect(isTextImportEnabled()).toBe(false);
  });

  it("is false when the key is empty", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(isTextImportEnabled()).toBe(false);
  });

  it("is false when the key is only whitespace", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "   ");
    expect(isTextImportEnabled()).toBe(false);
  });

  it("is true when the key is set", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test");
    expect(isTextImportEnabled()).toBe(true);
  });
});
