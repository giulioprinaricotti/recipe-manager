import { describe, it, expect } from "vitest";
import { translateIngredientName } from "./ingredient-translator";

describe("translateIngredientName — EN dictionary", () => {
  it("translates singular EN -> singular IT", () => {
    expect(translateIngredientName("tomato")).toBe("pomodoro");
    expect(translateIngredientName("onion")).toBe("cipolla");
    expect(translateIngredientName("carrot")).toBe("carota");
  });

  it("translates plural EN -> plural IT", () => {
    expect(translateIngredientName("tomatoes")).toBe("pomodori");
    expect(translateIngredientName("carrots")).toBe("carote");
    expect(translateIngredientName("eggs")).toBe("uova");
  });

  it("is case-insensitive", () => {
    expect(translateIngredientName("Tomato")).toBe("pomodoro");
    expect(translateIngredientName("EGGS")).toBe("uova");
  });

  it("translates multi-word EN compounds exactly", () => {
    expect(translateIngredientName("olive oil")).toBe("olio d'oliva");
    expect(translateIngredientName("red onion")).toBe("cipolla rossa");
    expect(translateIngredientName("bell pepper")).toBe("peperone");
  });

  it("falls back to last-token EN match for unknown compounds", () => {
    expect(translateIngredientName("fresh tomato")).toBe("pomodoro");
    expect(translateIngredientName("large carrots")).toBe("carote");
  });

  it("preserves bare 'pepper' input — ambiguous and not in dictionary", () => {
    // Intentional miss: dictionary excludes plain "pepper"/"peppers".
    expect(translateIngredientName("pepper")).toBe("pepper");
  });

  it("returns input unchanged on miss (no fragile stemming)", () => {
    expect(translateIngredientName("xyz unknown")).toBe("xyz unknown");
    expect(translateIngredientName("")).toBe("");
  });
});

describe("translateIngredientName — new entries from real DB scan", () => {
  it("translates 'feta cheese' to 'feta' (avoids stale fallback to 'formaggio')", () => {
    // Regression: previously fell back to last-token "cheese" -> "formaggio".
    expect(translateIngredientName("feta cheese")).toBe("feta");
  });

  it("translates lime/limes", () => {
    expect(translateIngredientName("lime")).toBe("lime");
    expect(translateIngredientName("limes")).toBe("lime");
  });

  it("translates shallot/shallots to scalogno", () => {
    expect(translateIngredientName("shallot")).toBe("scalogno");
    expect(translateIngredientName("shallots")).toBe("scalogno");
  });

  it("translates avocado/avocados to avocado", () => {
    expect(translateIngredientName("avocado")).toBe("avocado");
    expect(translateIngredientName("avocados")).toBe("avocado");
  });

  it("translates fish family items", () => {
    expect(translateIngredientName("mackerel")).toBe("sgombro");
    expect(translateIngredientName("sardines")).toBe("sardine");
  });

  it("translates 'double cream' to 'panna'", () => {
    expect(translateIngredientName("double cream")).toBe("panna");
  });

  it("translates yoghurt variants to yogurt", () => {
    expect(translateIngredientName("yoghurt")).toBe("yogurt");
    expect(translateIngredientName("greek yogurt")).toBe("yogurt greco");
    expect(translateIngredientName("greek yoghurt")).toBe("yogurt greco");
  });

  it("translates cheddar variants", () => {
    expect(translateIngredientName("cheddar")).toBe("cheddar");
    expect(translateIngredientName("mature cheddar")).toBe("cheddar");
  });

  it("translates tomato puree/purée/paste consistently", () => {
    expect(translateIngredientName("tomato puree")).toBe("concentrato di pomodoro");
    expect(translateIngredientName("tomato purée")).toBe("concentrato di pomodoro");
    expect(translateIngredientName("tomato paste")).toBe("concentrato di pomodoro");
  });

  it("translates chilli/chili family", () => {
    expect(translateIngredientName("chilli")).toBe("peperoncino");
    expect(translateIngredientName("chili")).toBe("peperoncino");
    expect(translateIngredientName("chilli flakes")).toBe("peperoncino in fiocchi");
    expect(translateIngredientName("chili pepper")).toBe("peperoncino");
  });

  it("translates spring onion variants", () => {
    expect(translateIngredientName("spring onion")).toBe("cipollotto");
    expect(translateIngredientName("spring onions")).toBe("cipollotti");
  });

  it("translates gnocchi, kimchi, naan, polenta (passthrough-shaped staples)", () => {
    expect(translateIngredientName("gnocchi")).toBe("gnocchi");
    expect(translateIngredientName("kimchi")).toBe("kimchi");
    expect(translateIngredientName("naan")).toBe("pane naan");
    expect(translateIngredientName("polenta")).toBe("polenta");
  });

  it("translates egg yolk/white", () => {
    expect(translateIngredientName("egg yolk")).toBe("tuorlo");
    expect(translateIngredientName("egg whites")).toBe("albumi");
  });

  it("translates broth/stock variants to brodo", () => {
    expect(translateIngredientName("chicken stock")).toBe("brodo di pollo");
    expect(translateIngredientName("vegetable stock")).toBe("brodo vegetale");
  });
});

describe("translateIngredientName — IT alias canonicalization", () => {
  it("folds smart-quote variants to straight quotes", () => {
    expect(translateIngredientName("spicchio d’aglio")).toBe("spicchio d'aglio");
    expect(translateIngredientName("olio d’oliva")).toBe("olio d'oliva");
  });

  it("fixes scraping typos seen in DB", () => {
    expect(translateIngredientName("asperagus")).toBe("asparagi");
    expect(translateIngredientName("pasta sflogiata")).toBe("pasta sfoglia");
    expect(translateIngredientName("pasta sfogliata")).toBe("pasta sfoglia");
  });

  it("aliases bare 'pepe' to canonical 'pepe nero'", () => {
    expect(translateIngredientName("pepe")).toBe("pepe nero");
  });
});
