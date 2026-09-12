"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerAction } from "@/lib/auth/actions";
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

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState,
  );

  useEffect(() => {
    if (state?.success) {
      router.push("/login?registered=1");
    }
  }, [state?.success, router]);

  return (
    <AuthCard>
      <div className="space-y-1">
        <h1 className="text-lg font-bold tracking-tight">Create Account</h1>
        <p className="text-xs text-muted-foreground">
          Register with email and password. A blockchain wallet is not created
          during registration.
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
          <label htmlFor="username" className="text-xs font-medium">
            Username
          </label>
          <Input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="demo_user"
            required
            className="h-9"
            aria-invalid={Boolean(state?.fieldErrors?.username)}
          />
          <FieldError message={state?.fieldErrors?.username} />
        </div>

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
            autoComplete="new-password"
            required
            className="h-9"
            aria-invalid={Boolean(state?.fieldErrors?.password)}
          />
          <FieldError message={state?.fieldErrors?.password} />
          <p className="text-[10px] text-muted-foreground">
            At least 8 characters.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-xs font-medium">
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="h-9"
            aria-invalid={Boolean(state?.fieldErrors?.confirmPassword)}
          />
          <FieldError message={state?.fieldErrors?.confirmPassword} />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign In
        </Link>
      </p>
    </AuthCard>
  );
}
