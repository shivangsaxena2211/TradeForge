import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "out");
const targetDir = join(root, "lib", "blockchain", "contracts", "abis");

const contracts = [
  { name: "User", path: "User.sol/User.json" },
  { name: "Stock", path: "Stock.sol/Stock.json" },
];

mkdirSync(targetDir, { recursive: true });

for (const contract of contracts) {
  const sourcePath = join(outDir, contract.path);

  if (!existsSync(sourcePath)) {
    throw new Error(`Missing Foundry artifact: ${sourcePath}. Run forge build first.`);
  }

  const artifact = JSON.parse(readFileSync(sourcePath, "utf8"));
  const abiOnly = {
    contractName: contract.name,
    abi: artifact.abi,
  };

  writeFileSync(
    join(targetDir, `${contract.name}.json`),
    `${JSON.stringify(abiOnly, null, 2)}\n`,
    "utf8",
  );
}

console.log("Contract ABIs extracted to lib/blockchain/contracts/abis/");
