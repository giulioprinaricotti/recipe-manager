/**
 * EN -> IT ingredient-name dictionary applied at the Bring! export
 * boundary. Bring matches icons by ingredient name in the user's locale;
 * an IT user clicking "Add to Bring" on an EN-named ingredient will see
 * a generic placeholder ("the icon jumps"). Translating at output time
 * keeps stored recipes untouched (Giulio + AC see originals) while
 * giving Bring an IT name to match against.
 *
 * Coverage = top common ingredients seen in the real DB
 * (see scripts/find-untranslated.ts one-shot scan). Misses pass through
 * unchanged.
 *
 * Both singular and plural EN forms are listed explicitly to avoid
 * fragile stemming heuristics on a small input set.
 *
 * After translation the aggregator's `normalizeName` will singularize
 * the head-word for the KEY only (not the displayed name), so plural
 * entries like "carote" still merge with "carrot" -> "carota".
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
  shallot: "scalogno",
  shallots: "scalogno",
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
  "red pepper": "peperone rosso",
  "red peppers": "peperoni rossi",
  "green pepper": "peperone verde",
  "green peppers": "peperoni verdi",
  potato: "patata",
  potatoes: "patate",
  "sweet potato": "patata dolce",
  "sweet potatoes": "patate dolci",
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
  avocado: "avocado",
  avocados: "avocado",
  "spring onion": "cipollotto",
  "spring onions": "cipollotti",
  pumpkin: "zucca",
  squash: "zucca",

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
  tarragon: "dragoncello",
  chilli: "peperoncino",
  chili: "peperoncino",
  chillies: "peperoncini",
  chilies: "peperoncini",
  "chilli flakes": "peperoncino in fiocchi",
  "chilli powder": "peperoncino in polvere",
  "chili pepper": "peperoncino",
  jalapeno: "jalapeño",
  jalapenos: "jalapeños",

  // Proteins
  chicken: "pollo",
  "chicken breast": "petto di pollo",
  "chicken thigh": "coscia di pollo",
  "chicken thighs": "cosce di pollo",
  beef: "manzo",
  "ground beef": "macinato di manzo",
  "beef mince": "macinato di manzo",
  pork: "maiale",
  "pork mince": "macinato di maiale",
  veal: "vitello",
  lamb: "agnello",
  sausage: "salsiccia",
  sausages: "salsicce",
  bacon: "pancetta",
  lardons: "pancetta a cubetti",
  chorizo: "chorizo",
  prosciutto: "prosciutto",
  ham: "prosciutto cotto",
  salami: "salame",
  fish: "pesce",
  tuna: "tonno",
  salmon: "salmone",
  cod: "merluzzo",
  mackerel: "sgombro",
  sardines: "sardine",
  shrimp: "gamberi",
  shrimps: "gamberi",
  prawns: "gamberi",
  squid: "calamari",
  mussels: "cozze",
  clams: "vongole",
  egg: "uovo",
  eggs: "uova",
  "egg yolk": "tuorlo",
  "egg yolks": "tuorli",
  "egg white": "albume",
  "egg whites": "albumi",

  // Dairy
  milk: "latte",
  butter: "burro",
  cream: "panna",
  "heavy cream": "panna",
  "double cream": "panna",
  "sour cream": "panna acida",
  "creme fraiche": "panna acida",
  "crème fraîche": "panna acida",
  yogurt: "yogurt",
  yoghurt: "yogurt",
  "greek yogurt": "yogurt greco",
  "greek yoghurt": "yogurt greco",
  cheese: "formaggio",
  "goat cheese": "formaggio di capra",
  mozzarella: "mozzarella",
  parmesan: "parmigiano",
  "parmesan cheese": "parmigiano",
  pecorino: "pecorino",
  ricotta: "ricotta",
  mascarpone: "mascarpone",
  feta: "feta",
  "feta cheese": "feta",
  cheddar: "cheddar",
  "mature cheddar": "cheddar",
  gruyere: "groviera",
  "gruyère": "groviera",

  // Pantry
  salt: "sale",
  "sea salt": "sale",
  sugar: "zucchero",
  "brown sugar": "zucchero di canna",
  "vanilla sugar": "zucchero vanigliato",
  flour: "farina",
  "all-purpose flour": "farina 00",
  "buckwheat flour": "farina di grano saraceno",
  oil: "olio",
  "olive oil": "olio d'oliva",
  "extra virgin olive oil": "olio extravergine d'oliva",
  "vegetable oil": "olio di semi",
  vinegar: "aceto",
  "balsamic vinegar": "aceto balsamico",
  "white wine vinegar": "aceto di vino bianco",
  "apple cider vinegar": "aceto di mele",
  "black pepper": "pepe nero",
  "white pepper": "pepe bianco",
  "cayenne pepper": "pepe di cayenna",
  "baking powder": "lievito per dolci",
  "baking soda": "bicarbonato",
  yeast: "lievito",
  vanilla: "vaniglia",
  "vanilla extract": "estratto di vaniglia",
  honey: "miele",
  mustard: "senape",
  "dijon mustard": "senape di Digione",
  mayonnaise: "maionese",
  cumin: "cumino",
  "ground cumin": "cumino in polvere",
  nutmeg: "noce moscata",
  "ground nutmeg": "noce moscata",
  "soy sauce": "salsa di soia",
  "chilli sauce": "salsa piccante",
  "tomato puree": "concentrato di pomodoro",
  "tomato purée": "concentrato di pomodoro",
  "tomato paste": "concentrato di pomodoro",
  passata: "passata",
  "tortilla chips": "tortilla chips",
  nachos: "tortilla chips",
  "stock cube": "dado",
  "vegetable stock cube": "dado vegetale",

  // Pasta, rice, grains, bread
  pasta: "pasta",
  spaghetti: "spaghetti",
  penne: "penne",
  rigatoni: "rigatoni",
  fusilli: "fusilli",
  gnocchi: "gnocchi",
  rice: "riso",
  arborio: "riso arborio",
  bread: "pane",
  breadcrumbs: "pangrattato",
  panko: "panko",
  flour00: "farina 00",
  "00 flour": "farina 00",
  pastry: "pasta sfoglia",
  "shortcrust pastry": "pasta frolla",
  "puff pastry": "pasta sfoglia",
  naan: "pane naan",
  pita: "pita",
  pitta: "pita",
  tortilla: "tortilla",
  tortillas: "tortillas",
  couscous: "couscous",
  farro: "farro",
  polenta: "polenta",
  kimchi: "kimchi",

  // Legumes
  beans: "fagioli",
  "white beans": "fagioli bianchi",
  "black beans": "fagioli neri",
  "kidney beans": "fagioli rossi",
  "red beans": "fagioli rossi",
  lentils: "lenticchie",
  chickpeas: "ceci",
  chickpea: "ceci",
  garbanzo: "ceci",
  "garbanzo beans": "ceci",

  // Fruit
  apple: "mela",
  apples: "mele",
  banana: "banana",
  bananas: "banane",
  lemon: "limone",
  lemons: "limoni",
  lime: "lime",
  limes: "lime",
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
  fig: "fico",
  figs: "fichi",
  berries: "frutti di bosco",

  // Nuts and seeds
  almonds: "mandorle",
  almond: "mandorla",
  walnuts: "noci",
  walnut: "noce",
  hazelnuts: "nocciole",
  hazelnut: "nocciola",
  pinenuts: "pinoli",
  "pine nuts": "pinoli",
  pistachios: "pistacchi",
  pistachio: "pistacchio",
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
  "chicken stock": "brodo di pollo",
  "vegetable stock": "brodo vegetale",
  chocolate: "cioccolato",
  "dark chocolate": "cioccolato fondente",
  "chocolate chunks": "cioccolato a pezzi",
  cocoa: "cacao",
  cinnamon: "cannella",
  paprika: "paprica",
  "smoked paprika": "paprica affumicata",
  saffron: "zafferano",
};

/**
 * IT -> IT alias map. Collapses common variants of the same shopping-list
 * item to a single canonical IT name so the aggregator merges them.
 *
 * Used as a second-pass lookup after the EN dictionary; running last means
 * a translated EN entry can still be canonicalized (e.g. "yoghurt" -> EN
 * map -> "yogurt", then alias no-op).
 *
 * NB: keep entries to TRULY identical products. Do NOT collapse varieties
 * that affect shopping (e.g. "pomodorini ciliegino" vs "pomodorini
 * datterini" stay distinct — both are kept as "pomodorini" head-word but
 * the qualifier in the displayed name keeps them split via the aggregator
 * key when the user clearly typed different varieties).
 */
const IT_ALIASES: Record<string, string> = {
  // typos / scraping artefacts seen in DB
  asperagus: "asparagi",
  "pasta sflogiata": "pasta sfoglia",
  "pasta sfogliata": "pasta sfoglia",
  // bare puré -> concentrato
  "concentrato di pomodoro": "concentrato di pomodoro",
  // smart-quote vs straight-quote unification on "spicchio d'aglio"
  "spicchio d’aglio": "spicchio d'aglio",
  "spicchi d’aglio": "spicchi d'aglio",
  "olio d’oliva": "olio d'oliva",
  "olio extravergine d’oliva": "olio extravergine d'oliva",
  // standard pepper variants
  pepe: "pepe nero",
};

function lookupEn(key: string): string | null {
  return EN_TO_IT[key] ?? null;
}

function lookupItAlias(key: string): string | null {
  return IT_ALIASES[key] ?? null;
}

/**
 * Translate an ingredient name from EN to IT when a mapping exists, then
 * resolve IT->IT aliases.
 *
 * Strategy:
 *   1. exact EN match;
 *   2. on multi-word input, last-token EN match ("fresh tomato" -> "tomato");
 *   3. IT alias canonicalization.
 *
 * No stemming — each EN form is listed explicitly. Returns the input
 * unchanged when no mapping is found.
 */
export function translateIngredientName(name: string): string {
  if (!name) return name;
  const normalised = name.toLowerCase().trim().replace(/\s+/g, " ");

  let out = normalised;
  const exact = lookupEn(normalised);
  if (exact) {
    out = exact;
  } else {
    const parts = normalised.split(" ");
    if (parts.length > 1) {
      const last = parts[parts.length - 1];
      const lastHit = lookupEn(last);
      if (lastHit) out = lastHit;
    }
  }

  // Second pass: IT alias canonicalization (smart-quote folding, common
  // typos). Cheap, idempotent — runs whether or not EN matched.
  const aliased = lookupItAlias(out);
  if (aliased) out = aliased;

  return out === normalised ? name : out;
}
