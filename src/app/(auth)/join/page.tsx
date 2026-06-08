import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPublicInviteToken } from "@/lib/public-invite";

/**
 * Public landing for self-serve signup. Hides the env-configured token so it
 * never appears in marketing/links — the user shares `/join`, the server
 * forwards to the canonical invite flow.
 *
 * If PUBLIC_INVITE_TOKEN is unset → 404 (public signup disabled).
 * If already logged in → straight to /recipes (no spurious "accept" CTA).
 */
export default async function JoinPage() {
  const token = getPublicInviteToken();
  if (!token) notFound();

  const session = await auth();
  if (session?.user) redirect("/recipes");

  redirect(`/invite/${token}`);
}
