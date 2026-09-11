import { describe, expect, it } from "vitest";

import { getAnvilAdminPrivateKey } from "@/lib/blockchain/admin-key";
import { DEMO_VIRTUAL_CASH_TARGET_PAISE } from "@/lib/demo/constants";
import { formatEth } from "@/lib/demo/fund-wallet";
import { parseEther } from "ethers";

describe("demo fund helpers", () => {
  it("targets ₹100,000 virtual cash in paise", () => {
    expect(DEMO_VIRTUAL_CASH_TARGET_PAISE).toBe(BigInt(10_000_000));
    expect(Number(DEMO_VIRTUAL_CASH_TARGET_PAISE) / 100).toBe(100_000);
  });

  it("formats ETH balances", () => {
    expect(formatEth(parseEther("0.1"))).toBe("0.1000");
    expect(formatEth(parseEther("1"))).toBe("1.0000");
  });

  it("requires ANVIL_ADMIN_PRIVATE_KEY when unset", () => {
    const original = process.env.ANVIL_ADMIN_PRIVATE_KEY;
    const legacy = process.env.BLOCKCHAIN_ADMIN_PRIVATE_KEY;

    delete process.env.ANVIL_ADMIN_PRIVATE_KEY;
    delete process.env.BLOCKCHAIN_ADMIN_PRIVATE_KEY;

    expect(() => getAnvilAdminPrivateKey()).toThrow(/ANVIL_ADMIN_PRIVATE_KEY/);

    process.env.ANVIL_ADMIN_PRIVATE_KEY = original;
    process.env.BLOCKCHAIN_ADMIN_PRIVATE_KEY = legacy;
  });
});
