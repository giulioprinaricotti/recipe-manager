"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
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
  const { data: session, status: sessionStatus } = useSession();
  const isLoggedIn = sessionStatus === "authenticated";

  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  // Suppresses the post-signup flash: once we kick off the redirect, hide
  // the page chrome (which would otherwise re-render in "logged-in" mode
  // for a frame between session refresh and router.push).
  const [isRedirecting, setIsRedirecting] = useState(false);

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

  async function handleAccept() {
    setIsAccepting(true);
    setAcceptError(null);

    const res = await fetch(`/api/invitations/${token}/accept`, {
      method: "POST",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setAcceptError(data.error ?? "Failed to accept invitation");
      setIsAccepting(false);
      return;
    }

    const data = (await res.json()) as { recipeId: string | null };
    setIsRedirecting(true);
    router.push(data.recipeId ? `/recipes/${data.recipeId}` : "/recipes");
    router.refresh();
  }

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

    if (result?.error) {
      setIsSubmitting(false);
      setSubmitError("Account created but sign-in failed. Please log in.");
    } else {
      // Keep isSubmitting + isRedirecting true so the form/CTA never gets
      // a chance to switch to the logged-in branch before navigation.
      setIsRedirecting(true);
      router.push("/recipes");
      router.refresh();
    }
  }

  if (isLoading || sessionStatus === "loading" || isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {isRedirecting ? "Taking you in..." : "Loading invitation..."}
        </p>
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

  const headerCopy = isLoggedIn
    ? {
        title: `${info!.inviterName} shared a recipe with you`,
        description: `Signed in as ${session?.user?.email}. Add a copy to your collection.`,
      }
    : {
        title: `${info!.inviterName} invited you to join!`,
        description: "Create your account to get started.",
      };

  return (
    <div className="flex min-h-screen items-center justify-center py-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{headerCopy.title}</CardTitle>
          <CardDescription>{headerCopy.description}</CardDescription>
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
                A copy will be added to your collection.
              </p>
            </div>
          </div>
        )}

        {isLoggedIn ? (
          <CardContent className="flex flex-col gap-4">
            {acceptError && (
              <p className="text-sm text-destructive">{acceptError}</p>
            )}
            <Button
              onClick={handleAccept}
              disabled={isAccepting}
              className="w-full"
            >
              {isAccepting
                ? "Adding to your collection..."
                : info!.recipe
                  ? "Add to my collection"
                  : "Accept invitation"}
            </Button>
            <Link
              href="/recipes"
              className="text-sm text-muted-foreground hover:text-foreground text-center"
            >
              Cancel
            </Link>
          </CardContent>
        ) : (
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
        )}
      </Card>
    </div>
  );
}
