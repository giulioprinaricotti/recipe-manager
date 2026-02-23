import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";
import { MobileNav } from "./mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <nav className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2 md:gap-6">
            <MobileNav userName={session.user.name || session.user.email} />
            <Link href="/recipes" className="text-lg font-semibold">
              Recipe Manager
            </Link>
            <Link
              href="/recipes"
              className="hidden text-sm text-muted-foreground hover:text-foreground md:inline"
            >
              Recipes
            </Link>
            <Link
              href="/meal-plans"
              className="hidden text-sm text-muted-foreground hover:text-foreground md:inline"
            >
              Meal Plans
            </Link>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <span className="text-sm text-muted-foreground">
              {session.user.name || session.user.email}
            </span>
            <SignOutButton />
          </div>
        </nav>
      </header>
      <main className="container mx-auto flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
