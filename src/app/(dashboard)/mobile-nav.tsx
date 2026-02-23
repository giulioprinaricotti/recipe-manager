"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SignOutButton } from "./sign-out-button";

export function MobileNav({ userName }: { userName: string | null | undefined }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle>Recipe Manager</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2 px-4">
          <Link
            href="/recipes"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Recipes
          </Link>
          <Link
            href="/meal-plans"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Meal Plans
          </Link>
        </nav>
        <div className="flex flex-col gap-2 border-t px-4 pt-4">
          {userName && (
            <span className="text-sm text-muted-foreground">{userName}</span>
          )}
          <SignOutButton />
        </div>
      </SheetContent>
    </Sheet>
  );
}
