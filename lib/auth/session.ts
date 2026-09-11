import { redirect } from "next/navigation";

import { auth } from "@/auth";

import type { SessionUser } from "./types";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();

  if (!session?.user?.id || !session.user.email || !session.user.name) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    username: session.user.name,
  };
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
