import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <RegisterForm />
    </div>
  );
}
