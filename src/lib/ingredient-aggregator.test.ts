import { describe, it, expect } from "vitest";
import { aggregateIngredients, normalizeName } from "./ingredient-aggregator";

describe("normalizeName — KEY pipeline (lowercase, strip, singularize head)", () => {
  it("lowercases and trims", () => {
    expect(normalizeName("  POMODORO  ")).toBe("pomodoro");
  });

  it("collapses internal whitespace", () => {
    expect(normalizeName("olio   extravergine    d'oliva")).toBe(
      "olio extravergine d'oliva"
    );
  });

  it("drops parentheticals", () => {
    expect(normalizeName("latte (di tua scelta)")).toBe("latte");
    expect(normalizeName("guacamole or mashed avocado (optional)")).toBe(
      "guacamole or mashed avocado"
    );
  });

  it("drops trailing clauses after the first comma", () => {
    // Aggregator runs AFTER the translator: it sees IT names. EN strings
    // here are illustrative of the parser-output shape (clause-stripping
    // is name-agnostic).
    expect(normalizeName("cipolla, tritata finemente")).toBe("cipolla");
    expect(normalizeName("limone, scorza grattugiata")).toBe("limone");
  });

  it("strips IT shopping-irrelevant qualifiers", () => {
    expect(normalizeName("basilico fresco")).toBe("basilico");
    expect(normalizeName("origano secco")).toBe("origano");
    expect(normalizeName("parmigiano grattugiato")).toBe("parmigiano");
    expect(normalizeName("olive denocciolate")).toBe("olive");
  });

  it("strips EN shopping-irrelevant qualifiers (when leaked into stored names)", () => {
    // EN qualifiers exist in the qualifier set as a defensive layer — some
    // ingredients sit in the DB as raw EN (translator misses); stripping
    // these still helps merging across recipes.
    expect(normalizeName("fresh basil")).toBe("basil");
    expect(normalizeName("chopped onion")).toBe("onion");
    expect(normalizeName("frozen peas")).toBe("peas");
  });
});

describe("normalizeName — singularize head-word only (no false merges)", () => {
  it("singularizes IT plural head-words", () => {
    expect(normalizeName("pomodori")).toBe("pomodoro");
    expect(normalizeName("carote")).toBe("carota");
    expect(normalizeName("uova")).toBe("uovo");
  });

  it("preserves modifiers (cipolle rosse vs cipolla bianca stay distinct)", () => {
    const red = normalizeName("cipolle rosse");
    const white = normalizeName("cipolla bianca");
    expect(red).toBe("cipolla rosse");
    expect(white).toBe("cipolla bianca");
    expect(red).not.toBe(white);
  });

  it("does NOT singularize plural tantum (olive, piselli, spinaci, ...)", () => {
    expect(normalizeName("olive")).toBe("olive");
    expect(normalizeName("piselli")).toBe("piselli");
    expect(normalizeName("spinaci")).toBe("spinaci");
    expect(normalizeName("broccoli")).toBe("broccoli");
    expect(normalizeName("ceci")).toBe("ceci");
    expect(normalizeName("lenticchie")).toBe("lenticchie");
  });

  it("does not touch unknown head-words (no morphological guess)", () => {
    expect(normalizeName("xyz")).toBe("xyz");
  });
});

describe("aggregateIngredients — single-item and passthrough", () => {
  it("returns single items unchanged", () => {
    const items = [{ name: "pomodoro", quantity: "200", unit: "g" }];
    const out = aggregateIngredients(items);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe("pomodoro");
  });

  it("passes alternativeGroupId items through without merging", () => {
    const items = [
      { name: "burro", quantity: "100", unit: "g", alternativeGroupId: "alt1" },
      { name: "olio", quantity: "100", unit: "ml", alternativeGroupId: "alt1" },
      { name: "burro", quantity: "50", unit: "g" },
    ];
    const out = aggregateIngredients(items);
    // The two alternatives stay separate; the plain butter is its own row.
    expect(out).toHaveLength(3);
    const alts = out.filter((o) => o.alternativeGroupId === "alt1");
    expect(alts).toHaveLength(2);
  });
});

describe("aggregateIngredients — numeric merging", () => {
  it("sums quantities for same name + unit", () => {
    const items = [
      { name: "pomodoro", quantity: "200", unit: "g" },
      { name: "pomodoro", quantity: "300", unit: "g" },
    ];
    const out = aggregateIngredients(items);
    expect(out).toHaveLength(1);
    expect(out[0].quantity).toBe("500");
    expect(out[0].unit).toBe("g");
  });

  it("canonicalizes units before grouping (gr -> g)", () => {
    const items = [
      { name: "pasta", quantity: "200", unit: "g" },
      { name: "pasta", quantity: "100", unit: "gr" },
    ];
    const out = aggregateIngredients(items);
    expect(out).toHaveLength(1);
    expect(out[0].quantity).toBe("300");
  });

  it("does NOT merge mixed numeric / non-numeric groups", () => {
    const items = [
      { name: "sale", quantity: "5", unit: "g" },
      { name: "sale", quantity: "q.b.", unit: null },
    ];
    const out = aggregateIngredients(items);
    // Different unit keys (g vs ""), so they stay separate either way.
    expect(out).toHaveLength(2);
  });

  it("does NOT merge when units differ", () => {
    const items = [
      { name: "latte", quantity: "200", unit: "ml" },
      { name: "latte", quantity: "1", unit: "l" },
    ];
    const out = aggregateIngredients(items);
    expect(out).toHaveLength(2);
  });

  it("supports fractional and decimal quantities", () => {
    const items = [
      { name: "farina", quantity: "1/2", unit: "kg" },
      { name: "farina", quantity: "0.5", unit: "kg" },
    ];
    const out = aggregateIngredients(items);
    expect(out).toHaveLength(1);
    expect(out[0].quantity).toBe("1");
  });

  it("treats optional only when ALL members are optional", () => {
    const items = [
      { name: "menta", quantity: "5", unit: "g", optional: true },
      { name: "menta", quantity: "5", unit: "g", optional: false },
    ];
    const out = aggregateIngredients(items);
    expect(out).toHaveLength(1);
    expect(out[0].optional).toBe(false);
  });
});

describe("aggregateIngredients — head-word singularize merges plural+singular", () => {
  it("merges 'pomodori' and 'pomodoro' on same unit", () => {
    const items = [
      { name: "pomodori", quantity: "300", unit: "g" },
      { name: "pomodoro", quantity: "200", unit: "g" },
    ];
    const out = aggregateIngredients(items);
    expect(out).toHaveLength(1);
    expect(out[0].quantity).toBe("500");
  });

  it("merges qualified IT with plain IT (basilico fresco + basilico)", () => {
    const items = [
      { name: "basilico fresco", quantity: "10", unit: "g" },
      { name: "basilico", quantity: "5", unit: "g" },
    ];
    const out = aggregateIngredients(items);
    expect(out).toHaveLength(1);
    expect(out[0].quantity).toBe("15");
  });

  it("does NOT merge varietal qualifiers (cipolle rosse vs cipolla bianca)", () => {
    const items = [
      { name: "cipolle rosse", quantity: "100", unit: "g" },
      { name: "cipolla bianca", quantity: "100", unit: "g" },
    ];
    const out = aggregateIngredients(items);
    expect(out).toHaveLength(2);
  });
});

describe("aggregateIngredients — EN/IT mixed end-to-end shape", () => {
  it("merges items only when key+unit match (translator runs upstream)", () => {
    // Simulates the route pipeline: translator already produced IT names,
    // aggregator does the dedup.
    const items = [
      { name: "carote", quantity: "200", unit: "g" }, // from "carrots"
      { name: "carota", quantity: "100", unit: "g" }, // from "carrot"
      { name: "carote", quantity: "50", unit: "g" }, // duplicate
    ];
    const out = aggregateIngredients(items);
    expect(out).toHaveLength(1);
    expect(out[0].quantity).toBe("350");
  });
});
