import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In",
};

type LoginPageProps = {
  searchParams: Promise<{ registered?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const showRegisteredMessage = params.registered === "1";

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {showRegisteredMessage ? (
          <p
            className="rounded-lg border bg-muted/50 px-4 py-3 text-center text-sm text-muted-foreground"
            role="status"
          >
            Account created successfully. Please sign in with your credentials.
          </p>
        ) : null}
        <LoginForm />
      </div>
    </div>
  );
}
