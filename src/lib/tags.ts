export const TAG_CATEGORIES = [
  { slug: "dietary", label: "Dietary" },
  { slug: "meal-type", label: "Meal type" },
  { slug: "season", label: "Season" },
  { slug: "prep", label: "Prep" },
  { slug: "flavor", label: "Flavor" },
] as const;

export type TagCategory = (typeof TAG_CATEGORIES)[number]["slug"];

export const RECIPE_TAGS = [
  {
    slug: "vegetarian",
    label: "Vegetarian",
    category: "dietary",
    colorClasses: "bg-green-100 text-green-800",
  },
  {
    slug: "vegan",
    label: "Vegan",
    category: "dietary",
    colorClasses: "bg-emerald-100 text-emerald-800",
  },
  {
    slug: "omega-3",
    label: "Omega-3",
    category: "dietary",
    colorClasses: "bg-teal-100 text-teal-800",
  },
  {
    slug: "breakfast",
    label: "Breakfast",
    category: "meal-type",
    colorClasses: "bg-rose-100 text-rose-800",
  },
  {
    slug: "main",
    label: "Main course",
    category: "meal-type",
    colorClasses: "bg-indigo-100 text-indigo-800",
  },
  {
    slug: "dessert",
    label: "Dessert",
    category: "meal-type",
    colorClasses: "bg-pink-100 text-pink-800",
  },
  {
    slug: "spring",
    label: "Spring",
    category: "season",
    colorClasses: "bg-lime-100 text-lime-800",
  },
  {
    slug: "summer",
    label: "Summer",
    category: "season",
    colorClasses: "bg-yellow-100 text-yellow-800",
  },
  {
    slug: "autumn",
    label: "Autumn",
    category: "season",
    colorClasses: "bg-orange-100 text-orange-800",
  },
  {
    slug: "winter",
    label: "Winter",
    category: "season",
    colorClasses: "bg-sky-100 text-sky-800",
  },
  {
    slug: "one-pan",
    label: "One Pan",
    category: "prep",
    colorClasses: "bg-amber-100 text-amber-800",
  },
  {
    slug: "less-than-20min",
    label: "< 20 min",
    category: "prep",
    colorClasses: "bg-blue-100 text-blue-800",
  },
  {
    slug: "spicy",
    label: "Spicy",
    category: "flavor",
    colorClasses: "bg-red-100 text-red-800",
  },
] as const;

export type TagSlug = (typeof RECIPE_TAGS)[number]["slug"];

export function getTag(slug: string) {
  return RECIPE_TAGS.find((t) => t.slug === slug);
}

export function getTagsByCategory(category: TagCategory) {
  return RECIPE_TAGS.filter((t) => t.category === category);
}
