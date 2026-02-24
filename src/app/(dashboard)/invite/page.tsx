"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInvitation, getUserRecipes } from "./actions";

export default function InvitePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [recipes, setRecipes] = useState<{ id: string; title: string }[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.isAdmin) {
      router.replace("/recipes");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user?.isAdmin) {
      getUserRecipes().then(setRecipes);
    }
  }, [session]);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    setGeneratedLink("");

    const result = await createInvitation(selectedRecipeId || undefined);

    setIsGenerating(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    const link = `${window.location.origin}/invite/${result.token}`;
    setGeneratedLink(link);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (status === "loading" || !session?.user?.isAdmin) {
    return null;
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Invite Someone</CardTitle>
          <CardDescription>
            Generate a one-time invite link. Optionally attach a welcome recipe
            that gets added to their favourites on signup.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="grid gap-2">
            <Label htmlFor="recipe">Welcome recipe (optional)</Label>
            <select
              id="recipe"
              value={selectedRecipeId}
              onChange={(e) => setSelectedRecipeId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">No recipe</option>
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Generate Invite Link"}
          </Button>

          {generatedLink && (
            <div className="grid gap-2">
              <Label>Invite link</Label>
              <div className="flex gap-2">
                <Input value={generatedLink} readOnly className="font-mono text-xs" />
                <Button variant="outline" onClick={handleCopy} className="shrink-0">
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
