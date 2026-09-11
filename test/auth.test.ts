import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  formatZodErrors,
  loginSchema,
  registerSchema,
} from "@/lib/validation/auth";

describe("registration validation", () => {
  it("accepts valid registration input", () => {
    const parsed = registerSchema.safeParse({
      username: "demo_trader",
      email: "Trader@Example.com",
      password: "secure-pass-1",
      confirmPassword: "secure-pass-1",
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data?.email).toBe("trader@example.com");
  });

  it("rejects invalid email", () => {
    const parsed = registerSchema.safeParse({
      username: "demo_trader",
      email: "not-an-email",
      password: "secure-pass-1",
      confirmPassword: "secure-pass-1",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects weak password", () => {
    const parsed = registerSchema.safeParse({
      username: "demo_trader",
      email: "trader@example.com",
      password: "short",
      confirmPassword: "short",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects password mismatch", () => {
    const parsed = registerSchema.safeParse({
      username: "demo_trader",
      email: "trader@example.com",
      password: "secure-pass-1",
      confirmPassword: "different-pass",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(formatZodErrors(parsed.error).confirmPassword).toBe(
        "Passwords do not match.",
      );
    }
  });

  it("rejects invalid username characters", () => {
    const parsed = registerSchema.safeParse({
      username: "bad user",
      email: "trader@example.com",
      password: "secure-pass-1",
      confirmPassword: "secure-pass-1",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("login validation", () => {
  it("accepts valid login input", () => {
    const parsed = loginSchema.safeParse({
      email: "User@Example.com",
      password: "secure-pass-1",
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data?.email).toBe("user@example.com");
  });

  it("rejects empty password", () => {
    const parsed = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const parsed = loginSchema.safeParse({
      email: "invalid",
      password: "secure-pass-1",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("password hashing", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("secure-pass-1");
    expect(hash).not.toContain("secure-pass-1");
    expect(await verifyPassword("secure-pass-1", hash)).toBe(true);
  });

  it("rejects an invalid password", async () => {
    const hash = await hashPassword("secure-pass-1");
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });
});

describe("auth error safety", () => {
  it("does not expose account enumeration hints in schema messages", () => {
    const loginFailure = loginSchema.safeParse({
      email: "missing@example.com",
      password: "",
    });

    const message = loginFailure.success
      ? ""
      : formatZodErrors(loginFailure.error).password ?? "";

    expect(message).not.toMatch(/not found|does not exist|no account/i);
  });
});
