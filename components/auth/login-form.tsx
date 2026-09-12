"use client";

import Link from "next/link";
import { useActionState } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/lib/auth/actions";
import type { AuthActionState } from "@/lib/auth/types";

const initialState: AuthActionState | null = null;

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  );
}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <AuthCard>
      <div className="space-y-1">
        <h1 className="text-lg font-bold tracking-tight">Sign In</h1>
        <p className="text-xs text-muted-foreground">
          Access your DEFINN simulation account. Wallet setup comes after
          login.
        </p>
      </div>

      <form action={formAction} className="mt-5 space-y-3.5" noValidate>
        {state?.error ? (
          <p
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-medium">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            className="h-9"
            aria-invalid={Boolean(state?.fieldErrors?.email)}
          />
          <FieldError message={state?.fieldErrors?.email} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-medium">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-9"
            aria-invalid={Boolean(state?.fieldErrors?.password)}
          />
          <FieldError message={state?.fieldErrors?.password} />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        No account?{" "}
        <Link
          href="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Create Account
        </Link>
      </p>
    </AuthCard>
  );
}
