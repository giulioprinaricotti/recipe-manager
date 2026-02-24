import Link from "next/link";
import {
  ChefHat,
  CalendarDays,
  ShoppingCart,
  ArrowLeft,
  ImagePlus,
  ListChecks,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-blue-50">
      {/* Top nav */}
      <div className="container mx-auto px-4 py-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Sign In
        </Link>
      </div>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-8 pb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          How <span className="text-amber-600">Recipe Manager</span> works
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          A quick walkthrough of what you can do once you&apos;re in.
        </p>
      </section>

      {/* Section 1: Add Recipes */}
      <section className="container mx-auto px-4 py-12">
        <div className="rounded-3xl bg-amber-50 border border-amber-100 p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-shrink-0">
              <div className="rounded-2xl bg-amber-200 p-6">
                <ChefHat className="size-16 text-amber-700" />
              </div>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold sm:text-3xl mb-3">
                Add your recipes
              </h2>
              <p className="text-muted-foreground text-lg mb-6">
                Head to the{" "}
                <Link href="/recipes" className="underline text-amber-700">
                  Recipes
                </Link>{" "}
                page and hit <strong>Add Recipe</strong>. You can write down
                ingredients, step-by-step instructions, cooking times, and
                servings. Each recipe lives on its own page where you can edit
                everything later.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl bg-white p-4 shadow-sm border border-amber-100">
                  <ImagePlus className="size-8 text-amber-500 mb-2" />
                  <p className="font-medium text-sm">Cover images</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Search Unsplash for a photo right from the recipe page
                  </p>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm border border-amber-100">
                  <ListChecks className="size-8 text-amber-500 mb-2" />
                  <p className="font-medium text-sm">Ingredients & steps</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add them one by one — they stay in order
                  </p>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm border border-amber-100">
                  <Tag className="size-8 text-amber-500 mb-2" />
                  <p className="font-medium text-sm">Tags</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mark recipes as Vegetarian, Quick, Spicy, etc. to filter
                    later
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Plan Meals */}
      <section className="container mx-auto px-4 py-12">
        <div className="rounded-3xl bg-blue-50 border border-blue-100 p-8 md:p-12">
          <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-12">
            <div className="flex-shrink-0">
              <div className="rounded-2xl bg-blue-200 p-6">
                <CalendarDays className="size-16 text-blue-700" />
              </div>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold sm:text-3xl mb-3">
                Plan your week
              </h2>
              <p className="text-muted-foreground text-lg mb-4">
                Open{" "}
                <Link href="/meal-plans" className="underline text-blue-700">
                  Meal Plans
                </Link>{" "}
                to see a calendar of upcoming weeks. Pick a week, then add
                recipes to it from your collection. You can reorder them however
                you like and look back at what you cooked in past weeks.
              </p>
              <p className="text-muted-foreground text-lg">
                There&apos;s also an <strong>Add to Next Week</strong> button on
                every recipe page if you want a quick shortcut.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Shop with Bring! */}
      <section className="container mx-auto px-4 py-12">
        <div className="rounded-3xl bg-green-50 border border-green-100 p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-shrink-0">
              <div className="rounded-2xl bg-green-200 p-6">
                <ShoppingCart className="size-16 text-green-700" />
              </div>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold sm:text-3xl mb-3">
                Send ingredients to Bring!
              </h2>
              <p className="text-muted-foreground text-lg mb-4">
                <a
                  href="https://getbring.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-green-700"
                >
                  Bring!
                </a>{" "}
                is a shopping list app. When you open a recipe, you&apos;ll see
                a <strong>Share to Bring!</strong> button — tap it and all the
                ingredients get added to your Bring! list. That&apos;s it, no
                copy-pasting.
              </p>
              <p className="text-muted-foreground text-lg mb-6">
                You&apos;ll need Bring! installed on your phone for this to
                work:
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <a
                  href="https://apps.apple.com/app/bring-shopping-list-recipes/id580669177"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-black text-white px-5 py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-5 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  App Store
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=ch.publisheria.bring"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-black text-white px-5 py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-5 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 010 1.38l-2.302 2.302L15.093 12l2.605-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z" />
                  </svg>
                  Google Play
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground text-lg mb-6">
          That&apos;s pretty much it. Sign in and give it a go.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="text-base">
            <Link href="/signup">Create Account</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-base">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </section>

      {/* Footer spacer */}
      <div className="h-8" />
    </div>
  );
}
