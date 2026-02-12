"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function signUp(formData: {
  email: string;
  name: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  const existingUser = await prisma.user.findUnique({
    where: { email: formData.email },
  });

  if (existingUser) {
    return { success: false, error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(formData.password, 12);

  await prisma.user.create({
    data: {
      email: formData.email,
      name: formData.name,
      passwordHash,
    },
  });

  return { success: true };
}
