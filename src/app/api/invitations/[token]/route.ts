import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { cloneRecipeForUser } from "@/lib/recipe-clone";
import { isPublicInviteToken } from "@/lib/public-invite";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Reusable open-invite token: no DB row, always valid, no attached recipe.
  if (isPublicInviteToken(token)) {
    return NextResponse.json({
      inviterName: "dueforchette",
      recipe: null,
    });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      inviter: { select: { name: true, email: true } },
      recipe: {
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          cookTime: true,
        },
      },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
  }

  if (invitation.usedAt) {
    return NextResponse.json({ error: "This invitation has already been used" }, { status: 410 });
  }

  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invitation has expired" }, { status: 410 });
  }

  return NextResponse.json({
    inviterName: invitation.inviter.name || invitation.inviter.email,
    recipe: invitation.recipe ?? null,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const body = await req.json();
  const { name, email, password } = body as {
    name: string;
    email: string;
    password: string;
  };

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Open-invite path: env-configured token, no DB invitation to consume,
  // no recipe to clone, no usedAt to mark.
  if (isPublicInviteToken(token)) {
    await prisma.user.create({ data: { name, email, passwordHash } });
    return NextResponse.json({ success: true });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
  }

  if (invitation.usedAt) {
    return NextResponse.json({ error: "This invitation has already been used" }, { status: 410 });
  }

  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invitation has expired" }, { status: 410 });
  }

  await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { name, email, passwordHash },
    });

    await tx.invitation.update({
      where: { token },
      data: { usedAt: new Date() },
    });

    if (invitation.recipeId) {
      await cloneRecipeForUser(tx, invitation.recipeId, newUser.id);
    }
  });

  return NextResponse.json({ success: true });
}
