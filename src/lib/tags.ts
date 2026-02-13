export const RECIPE_TAGS = [
  {
    slug: "vegetarian",
    label: "Vegetarian",
    colorClasses: "bg-green-100 text-green-800",
  },
  {
    slug: "vegan",
    label: "Vegan",
    colorClasses: "bg-emerald-100 text-emerald-800",
  },
  {
    slug: "one-pan",
    label: "One Pan",
    colorClasses: "bg-amber-100 text-amber-800",
  },
  {
    slug: "less-than-20min",
    label: "< 20 min",
    colorClasses: "bg-blue-100 text-blue-800",
  },
  {
    slug: "spicy",
    label: "Spicy",
    colorClasses: "bg-red-100 text-red-800",
  },
] as const;

export type TagSlug = (typeof RECIPE_TAGS)[number]["slug"];

export function getTag(slug: string) {
  return RECIPE_TAGS.find((t) => t.slug === slug);
}
