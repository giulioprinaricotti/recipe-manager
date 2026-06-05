/**
 * EN -> IT ingredient-name dictionary applied at the Bring! export
 * boundary. Bring matches icons by ingredient name in the user's locale;
 * an IT user clicking "Add to Bring" on an EN-named ingredient will see
 * a generic placeholder ("the icon jumps"). Translating at output time
 * keeps stored recipes untouched (Giulio + AC see originals) while
 * giving Bring an IT name to match against.
 *
 * Coverage = top common ingredients. Misses pass through unchanged
 * (no regression: same behaviour as before this layer existed).
 *
 * Both singular and plural EN forms are listed explicitly to avoid
 * fragile stemming heuristics on a small input set.
 */
const EN_TO_IT: Record<string, string> = {
  // Vegetables
  tomato: "pomodoro",
  tomatoes: "pomodori",
  "cherry tomato": "pomodorini",
  "cherry tomatoes": "pomodorini",
  onion: "cipolla",
  onions: "cipolle",
  "red onion": "cipolla rossa",
  "red onions": "cipolle rosse",
  garlic: "aglio",
  "garlic clove": "spicchio d'aglio",
  "garlic cloves": "spicchi d'aglio",
  carrot: "carota",
  carrots: "carote",
  celery: "sedano",
  zucchini: "zucchina",
  zucchinis: "zucchine",
  courgette: "zucchina",
  courgettes: "zucchine",
  eggplant: "melanzana",
  eggplants: "melanzane",
  aubergine: "melanzana",
  aubergines: "melanzane",
  // Bare "pepper"/"peppers" omitted on purpose: ambiguous between
  // vegetable (peperone) and spice (pepe). Use the explicit forms.
  "bell pepper": "peperone",
  "bell peppers": "peperoni",
  potato: "patata",
  potatoes: "patate",
  spinach: "spinaci",
  lettuce: "lattuga",
  mushroom: "fungo",
  mushrooms: "funghi",
  broccoli: "broccoli",
  cauliflower: "cavolfiore",
  cabbage: "cavolo",
  leek: "porro",
  leeks: "porri",
  fennel: "finocchio",
  artichoke: "carciofo",
  artichokes: "carciofi",
  asparagus: "asparagi",
  peas: "piselli",
  corn: "mais",
  cucumber: "cetriolo",
  cucumbers: "cetrioli",
  radish: "ravanello",
  radishes: "ravanelli",
  beetroot: "barbabietola",
  beet: "barbabietola",
  arugula: "rucola",
  rocket: "rucola",

  // Herbs and aromatics
  basil: "basilico",
  parsley: "prezzemolo",
  rosemary: "rosmarino",
  sage: "salvia",
  thyme: "timo",
  oregano: "origano",
  mint: "menta",
  bay: "alloro",
  "bay leaf": "alloro",
  "bay leaves": "alloro",
  chives: "erba cipollina",
  dill: "aneto",
  cilantro: "coriandolo",
  coriander: "coriandolo",
  ginger: "zenzero",

  // Proteins
  chicken: "pollo",
  "chicken breast": "petto di pollo",
  "chicken thighs": "cosce di pollo",
  beef: "manzo",
  "ground beef": "macinato di manzo",
  pork: "maiale",
  veal: "vitello",
  lamb: "agnello",
  sausage: "salsiccia",
  sausages: "salsicce",
  bacon: "pancetta",
  prosciutto: "prosciutto",
  ham: "prosciutto cotto",
  salami: "salame",
  fish: "pesce",
  tuna: "tonno",
  salmon: "salmone",
  cod: "merluzzo",
  shrimp: "gamberi",
  shrimps: "gamberi",
  prawns: "gamberi",
  squid: "calamari",
  mussels: "cozze",
  clams: "vongole",
  egg: "uovo",
  eggs: "uova",

  // Dairy
  milk: "latte",
  butter: "burro",
  cream: "panna",
  "heavy cream": "panna",
  yogurt: "yogurt",
  cheese: "formaggio",
  mozzarella: "mozzarella",
  parmesan: "parmigiano",
  "parmesan cheese": "parmigiano",
  pecorino: "pecorino",
  ricotta: "ricotta",
  mascarpone: "mascarpone",

  // Pantry
  salt: "sale",
  "sea salt": "sale",
  sugar: "zucchero",
  "brown sugar": "zucchero di canna",
  flour: "farina",
  "all-purpose flour": "farina 00",
  oil: "olio",
  "olive oil": "olio d'oliva",
  "extra virgin olive oil": "olio extravergine d'oliva",
  "vegetable oil": "olio di semi",
  vinegar: "aceto",
  "balsamic vinegar": "aceto balsamico",
  "white wine vinegar": "aceto di vino bianco",
  "black pepper": "pepe nero",
  "white pepper": "pepe bianco",
  "baking powder": "lievito per dolci",
  "baking soda": "bicarbonato",
  yeast: "lievito",
  vanilla: "vaniglia",
  honey: "miele",
  mustard: "senape",
  mayonnaise: "maionese",

  // Pasta, rice, grains, bread
  pasta: "pasta",
  spaghetti: "spaghetti",
  penne: "penne",
  rigatoni: "rigatoni",
  fusilli: "fusilli",
  rice: "riso",
  arborio: "riso arborio",
  bread: "pane",
  breadcrumbs: "pangrattato",
  flour00: "farina 00",
  "00 flour": "farina 00",

  // Legumes
  beans: "fagioli",
  "white beans": "fagioli bianchi",
  "black beans": "fagioli neri",
  "kidney beans": "fagioli rossi",
  lentils: "lenticchie",
  chickpeas: "ceci",
  garbanzo: "ceci",
  "garbanzo beans": "ceci",

  // Fruit
  apple: "mela",
  apples: "mele",
  banana: "banana",
  bananas: "banane",
  lemon: "limone",
  lemons: "limoni",
  orange: "arancia",
  oranges: "arance",
  strawberry: "fragola",
  strawberries: "fragole",
  blueberry: "mirtillo",
  blueberries: "mirtilli",
  raspberry: "lampone",
  raspberries: "lamponi",
  pear: "pera",
  pears: "pere",
  peach: "pesca",
  peaches: "pesche",

  // Nuts and seeds
  almonds: "mandorle",
  walnuts: "noci",
  hazelnuts: "nocciole",
  pinenuts: "pinoli",
  "pine nuts": "pinoli",
  "sesame seeds": "semi di sesamo",

  // Common others
  water: "acqua",
  wine: "vino",
  "white wine": "vino bianco",
  "red wine": "vino rosso",
  broth: "brodo",
  "chicken broth": "brodo di pollo",
  "vegetable broth": "brodo vegetale",
  stock: "brodo",
  chocolate: "cioccolato",
  "dark chocolate": "cioccolato fondente",
  cocoa: "cacao",
  cinnamon: "cannella",
  paprika: "paprica",
  saffron: "zafferano",
};

function lookupExact(key: string): string | null {
  return EN_TO_IT[key] ?? null;
}

/**
 * Translate an ingredient name from EN to IT when a mapping exists.
 *
 * Strategy: exact match first; on multi-word input, fall back to the
 * last token (so "fresh tomato" -> "pomodoro" via the "tomato" key).
 * No stemming: each EN form must be listed explicitly to keep behaviour
 * predictable. Returns the input unchanged when no mapping is found.
 */
export function translateIngredientName(name: string): string {
  if (!name) return name;
  const normalised = name.toLowerCase().trim().replace(/\s+/g, " ");
  const exact = lookupExact(normalised);
  if (exact) return exact;

  const parts = normalised.split(" ");
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    const lastHit = lookupExact(last);
    if (lastHit) return lastHit;
  }

  return name;
}
