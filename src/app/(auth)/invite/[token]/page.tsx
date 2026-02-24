"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InvitationInfo = {
  inviterName: string;
  recipe: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    cookTime: number | null;
  } | null;
};

export default function InviteSignupPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();

  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/invitations/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setLoadError(data.error ?? "Invalid invitation");
        } else {
          setInfo(data);
        }
      })
      .catch(() => setLoadError("Failed to load invitation"))
      .finally(() => setIsLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const res = await fetch(`/api/invitations/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setSubmitError(data.error ?? "Sign up failed");
      setIsSubmitting(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setSubmitError("Account created but sign-in failed. Please log in.");
    } else {
      router.push("/recipes");
      router.refresh();
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading invitation...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Invitation unavailable</CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Go to login
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center py-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{info!.inviterName} invited you to join!</CardTitle>
          <CardDescription>Create your account to get started.</CardDescription>
        </CardHeader>

        {info!.recipe && (
          <div className="mx-6 mb-4 overflow-hidden rounded-lg border">
            {info!.recipe.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={info!.recipe.imageUrl}
                alt={info!.recipe.title}
                className="h-36 w-full object-cover"
              />
            )}
            <div className="p-3">
              <p className="font-medium text-sm">{info!.recipe.title}</p>
              {info!.recipe.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {info!.recipe.description}
                </p>
              )}
              {info!.recipe.cookTime && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Cook time: {info!.recipe.cookTime} min
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground italic">
                This recipe will be added to your favourites.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-4">
            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create Account"}
            </Button>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Already have an account? Sign in
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
