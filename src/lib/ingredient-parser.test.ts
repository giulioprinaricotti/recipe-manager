import { describe, it, expect } from "vitest";
import { parseIngredient } from "./ingredient-parser";

describe("parseIngredient — Italian format (name first)", () => {
  it("parses name + quantity + unit", () => {
    expect(parseIngredient("Paccheri rigati 320 g")).toEqual({
      name: "Paccheri rigati",
      quantity: "320",
      unit: "g",
    });
  });

  it("parses multi-word name + quantity + unit", () => {
    expect(parseIngredient("Pomodorini datterini 500 g")).toEqual({
      name: "Pomodorini datterini",
      quantity: "500",
      unit: "g",
    });
  });

  it("parses name + quantity without unit", () => {
    expect(parseIngredient("Cipollotto fresco piccolo 1")).toEqual({
      name: "Cipollotto fresco piccolo",
      quantity: "1",
      unit: null,
    });
  });

  it("parses q.b. (to taste)", () => {
    expect(parseIngredient("Basilico q.b.")).toEqual({
      name: "Basilico",
      quantity: "q.b.",
      unit: null,
    });
  });

  it("parses q.b. with multi-word name", () => {
    expect(parseIngredient("Sale fino q.b.")).toEqual({
      name: "Sale fino",
      quantity: "q.b.",
      unit: null,
    });
  });

  it("returns name only when no quantity", () => {
    expect(parseIngredient("Sale")).toEqual({
      name: "Sale",
      quantity: null,
      unit: null,
    });
  });

  it("handles ml unit", () => {
    expect(parseIngredient("Latte 200 ml")).toEqual({
      name: "Latte",
      quantity: "200",
      unit: "ml",
    });
  });

  it("handles kg unit", () => {
    expect(parseIngredient("Farina 1 kg")).toEqual({
      name: "Farina",
      quantity: "1",
      unit: "kg",
    });
  });

  it("handles Italian units", () => {
    expect(parseIngredient("Olio 2 cucchiai")).toEqual({
      name: "Olio",
      quantity: "2",
      unit: "cucchiai",
    });
  });
});

describe("parseIngredient — English format (quantity first)", () => {
  it("parses quantity + unit + name", () => {
    expect(parseIngredient("2 tbsp olive oil")).toEqual({
      name: "olive oil",
      quantity: "2",
      unit: "tbsp",
    });
  });

  it("parses quantity + unit + single-word name", () => {
    expect(parseIngredient("500 g flour")).toEqual({
      name: "flour",
      quantity: "500",
      unit: "g",
    });
  });

  it("parses quantity without unit", () => {
    expect(parseIngredient("3 eggs")).toEqual({
      name: "eggs",
      quantity: "3",
      unit: null,
    });
  });

  it("parses quantity joined to unit (no space)", () => {
    expect(parseIngredient("200g pasta")).toEqual({
      name: "pasta",
      quantity: "200",
      unit: "g",
    });
  });

  it("parses mixed number", () => {
    expect(parseIngredient("1 1/2 cups water")).toEqual({
      name: "water",
      quantity: "1 1/2",
      unit: "cups",
    });
  });

  it("parses fraction", () => {
    expect(parseIngredient("1/2 cup flour")).toEqual({
      name: "flour",
      quantity: "1/2",
      unit: "cup",
    });
  });

  it("parses decimal", () => {
    expect(parseIngredient("1.5 tsp salt")).toEqual({
      name: "salt",
      quantity: "1.5",
      unit: "tsp",
    });
  });

  it("handles imperial units", () => {
    expect(parseIngredient("8 oz cream cheese")).toEqual({
      name: "cream cheese",
      quantity: "8",
      unit: "oz",
    });
    expect(parseIngredient("2 lbs chicken")).toEqual({
      name: "chicken",
      quantity: "2",
      unit: "lbs",
    });
    expect(parseIngredient("1 qt broth")).toEqual({
      name: "broth",
      quantity: "1",
      unit: "qt",
    });
  });
});

describe("parseIngredient — unicode fractions", () => {
  it("normalises ½", () => {
    expect(parseIngredient("½ tsp salt")).toEqual({
      name: "salt",
      quantity: "1/2",
      unit: "tsp",
    });
  });

  it("normalises ¼", () => {
    expect(parseIngredient("¼ cup milk")).toEqual({
      name: "milk",
      quantity: "1/4",
      unit: "cup",
    });
  });

  it("normalises ¾", () => {
    expect(parseIngredient("¾ lb butter")).toEqual({
      name: "butter",
      quantity: "3/4",
      unit: "lb",
    });
  });
});

describe("parseIngredient — edge cases", () => {
  it("handles empty string", () => {
    expect(parseIngredient("")).toEqual({
      name: "",
      quantity: null,
      unit: null,
    });
  });

  it("handles whitespace only", () => {
    expect(parseIngredient("   ")).toEqual({
      name: "",
      quantity: null,
      unit: null,
    });
  });

  it("lowercases units", () => {
    expect(parseIngredient("200 G pasta")).toEqual({
      name: "pasta",
      quantity: "200",
      unit: "g",
    });
  });

  it("trims name", () => {
    expect(parseIngredient("  Burro 30 g  ")).toEqual({
      name: "Burro",
      quantity: "30",
      unit: "g",
    });
  });
});
