import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("start:local launcher", () => {
  it("prepares blockchain infrastructure without starting Next.js", () => {
    const source = readFileSync(
      join(process.cwd(), "scripts/start-local.ts"),
      "utf8",
    );

    expect(source).toContain("Blockchain environment ready");
    expect(source).not.toMatch(/\[\s*["']run["']\s*,\s*["']dev["']\s*\]/);
    expect(source).not.toContain("http://localhost:3000");
    expect(source).toContain("process.exit(0)");
  });
});
