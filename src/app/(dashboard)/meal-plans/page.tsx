import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateWeekRange,
  getWeekStart,
  toWeekId,
  formatWeekLabel,
} from "@/lib/weeks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WeekListScroller } from "./week-list-scroller";

export default async function MealPlansPage() {
  const session = await auth();
  const today = new Date();
  const weeks = generateWeekRange(8, 4, today);
  const currentWeekStart = getWeekStart(today);
  const currentWeekId = toWeekId(currentWeekStart);

  const mealPlans = await prisma.mealPlan.findMany({
    where: {
      userId: session!.user.id,
      weekStart: {
        gte: weeks[0],
        lte: weeks[weeks.length - 1],
      },
    },
    include: {
      items: {
        include: {
          recipe: {
            select: { id: true, title: true, imageUrl: true },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  const plansByWeek = new Map(
    mealPlans.map((p) => [p.weekStart.toISOString(), p])
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Meal Plans</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Plan your weekly meals and look back at past weeks.
        </p>
      </div>

      <WeekListScroller currentWeekId={currentWeekId}>
        <div className="space-y-3">
          {weeks.map((weekStart) => {
            const weekId = toWeekId(weekStart);
            const isCurrent = weekStart.getTime() === currentWeekStart.getTime();
            const isPast = weekStart.getTime() < currentWeekStart.getTime();
            const plan = plansByWeek.get(weekStart.toISOString());
            const recipes = plan?.items.map((i) => i.recipe) ?? [];

            return (
              <Link key={weekId} href={`/meal-plans/${weekId}`}>
                <Card
                  data-week-id={weekId}
                  className={cn(
                    "hover:shadow-md transition-shadow",
                    isCurrent && "border-primary border-2",
                    isPast && "opacity-60",
                    recipes.length === 0 && "border-dashed"
                  )}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {formatWeekLabel(weekStart, today)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recipes.length > 0 ? (
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2 shrink-0">
                          {recipes.slice(0, 4).map((recipe) =>
                            recipe.imageUrl ? (
                              <img
                                key={recipe.id}
                                src={recipe.imageUrl}
                                alt={recipe.title}
                                className="w-8 h-8 rounded-full object-cover border-2 border-background"
                              />
                            ) : (
                              <div
                                key={recipe.id}
                                className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground"
                              >
                                {recipe.title.charAt(0)}
                              </div>
                            )
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {recipes.map((r) => r.title).join(", ")}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No meals planned
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </WeekListScroller>
    </div>
  );
}
