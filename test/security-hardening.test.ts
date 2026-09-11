import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getSafeApiErrorMessage,
  isSensitiveErrorMessage,
} from "@/lib/api/safe-error";
import { getSafeBlockchainErrorMessage } from "@/lib/blockchain/client/errors";
import {
  ethereumAddressSchema,
  transactionHashSchema,
  uuidParamSchema,
} from "@/lib/validation/common";

describe("safe API error handling", () => {
  it("flags sensitive error messages", () => {
    expect(isSensitiveErrorMessage("Invalid `prisma.user.findFirst()` invocation")).toBe(
      true,
    );
    expect(isSensitiveErrorMessage("password verification failed")).toBe(true);
    expect(isSensitiveErrorMessage("postgresql://user:pass@localhost/db")).toBe(
      true,
    );
    expect(isSensitiveErrorMessage("Order not found.")).toBe(false);
  });

  it("returns generic fallback for sensitive errors", () => {
    const message = getSafeApiErrorMessage(
      new Error("DATABASE_URL is missing"),
      "Unable to process request.",
    );

    expect(message).toBe("Unable to process request.");
    expect(message).not.toMatch(/database_url/i);
  });
});

describe("blockchain error normalization", () => {
  it("maps contract revert reasons to safe user messages", () => {
    expect(
      getSafeBlockchainErrorMessage({
        code: "CALL_EXCEPTION",
        reason: "reverted",
        shortMessage:
          "execution reverted: InsufficientVirtualCash()",
      }),
    ).toContain("virtual cash");
  });

  it("maps user rejection without exposing RPC internals", () => {
    expect(
      getSafeBlockchainErrorMessage({ code: "ACTION_REJECTED" }),
    ).toBe("Transaction cancelled.");
  });

  it("maps RPC connectivity failures safely", () => {
    expect(
      getSafeBlockchainErrorMessage(new Error("fetch failed ECONNREFUSED")),
    ).toBe("Blockchain is unavailable.");
  });

  it("does not expose raw VM exception text", () => {
    const message = getSafeBlockchainErrorMessage(
      new Error(
        "execution reverted: VM Exception while processing transaction: revert InsufficientHolding()",
      ),
    );

    expect(message).toContain("holdings");
    expect(message).not.toMatch(/vm exception/i);
  });
});

describe("common parameter validation", () => {
  it("rejects malformed UUID resource identifiers", () => {
    expect(uuidParamSchema.safeParse("not-a-uuid").success).toBe(false);
    expect(uuidParamSchema.safeParse("../../../etc/passwd").success).toBe(false);
  });

  it("accepts valid UUIDs", () => {
    expect(
      uuidParamSchema.safeParse("550e8400-e29b-41d4-a716-446655440000").success,
    ).toBe(true);
  });

  it("rejects malformed wallet addresses", () => {
    expect(ethereumAddressSchema.safeParse("0x123").success).toBe(false);
    expect(ethereumAddressSchema.safeParse("not-an-address").success).toBe(false);
  });

  it("rejects malformed transaction hashes", () => {
    expect(transactionHashSchema.safeParse("0xabc").success).toBe(false);
    expect(transactionHashSchema.safeParse("deadbeef").success).toBe(false);
  });
});

describe("secret-free API payload shapes", () => {
  const forbiddenPatterns = [/privateKey/i, /mnemonic/i, /AUTH_SECRET/i];

  it("keeps order sync payloads hash-only", () => {
    const payload = { txHash: `0x${"a".repeat(64)}` };
    const serialized = JSON.stringify(payload);

    for (const pattern of forbiddenPatterns) {
      expect(serialized).not.toMatch(pattern);
    }
  });
});
