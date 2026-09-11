import "dotenv/config";

import { getSimulationEngineService } from "../lib/market/simulation/engine-service";

async function main() {
  const service = getSimulationEngineService();
  await service.ensureInitialized();
  service.start();

  // Run a single manual tick for CLI usage.
  const engine = await service.ensureInitialized();
  engine.advanceTick();
  await service.persistState();

  const status = await service.getStatus();
  console.log(
    `Simulation tick complete. Regime=${status.marketRegime} Sentiment=${status.sentiment} Tick=${status.tick}`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
