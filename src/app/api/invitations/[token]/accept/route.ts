import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cloneRecipeForUser } from "@/lib/recipe-clone";

/**
 * Accept-share for already-registered users. Mirrors the signup branch in
 * the POST handler one level up: clones the invited recipe into the caller's
 * collection and burns the invitation token.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  const invitation = await prisma.invitation.findUnique({ where: { token } });

  if (!invitation) {
    return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
  }
  if (invitation.usedAt) {
    return NextResponse.json(
      { error: "This invitation has already been used" },
      { status: 410 }
    );
  }
  if (invitation.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This invitation has expired" },
      { status: 410 }
    );
  }

  // Inviter cannot accept their own invite — would clone their recipe back
  // onto themselves.
  if (invitation.inviterId === userId) {
    return NextResponse.json(
      { error: "You cannot accept your own invitation" },
      { status: 400 }
    );
  }

  let clonedRecipeId: string | null = null;

  await prisma.$transaction(async (tx) => {
    await tx.invitation.update({
      where: { token },
      data: { usedAt: new Date() },
    });

    if (invitation.recipeId) {
      clonedRecipeId = await cloneRecipeForUser(tx, invitation.recipeId, userId);
    }
  });

  return NextResponse.json({ success: true, recipeId: clonedRecipeId });
}
