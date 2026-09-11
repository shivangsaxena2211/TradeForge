"use server";

import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { signIn, signOut } from "@/auth";
import { hashPassword } from "@/lib/auth/password";
import type { AuthActionState } from "@/lib/auth/types";
import { getPrismaClient } from "@/lib/db";
import {
  formatZodErrors,
  loginSchema,
  registerSchema,
} from "@/lib/validation/auth";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function loginAction(
  _prevState: AuthActionState | null,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: formatZodErrors(parsed.error),
      error: "Please check your input and try again.",
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }

    console.error("Login failed:", error);

    return {
      error: "Something went wrong. Please try again later.",
    };
  }
}

export async function registerAction(
  _prevState: AuthActionState | null,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: formatZodErrors(parsed.error),
      error: "Please fix the highlighted fields and try again.",
    };
  }

  const prisma = getPrismaClient();
  const email = parsed.data.email;
  const username = parsed.data.username;

  try {
    const existingEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingEmail) {
      return {
        fieldErrors: { email: "An account with this email already exists." },
        error: "An account with this email already exists.",
      };
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existingUsername) {
      return {
        fieldErrors: { username: "This username is already taken." },
        error: "This username is already taken.",
      };
    }

    const passwordHash = await hashPassword(parsed.data.password);

    await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
      },
    });

    return { success: true };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        error: "An account with this email or username already exists.",
      };
    }

    console.error("Registration failed:", error);

    return {
      error: "Something went wrong. Please try again later.",
    };
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
