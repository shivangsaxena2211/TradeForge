import { NextResponse } from "next/server";

import { logServerError } from "@/lib/api/safe-error";
import { ALLOWED_SPEED_MULTIPLIERS } from "@/lib/market/simulation/config";
import { getSimulationEngineService } from "@/lib/market/simulation/engine-service";
import { simulationControlSchema } from "@/lib/validation/market";

function isSimulationControlEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_SIMULATION_CONTROL === "true"
  );
}

export async function POST(request: Request) {
  if (!isSimulationControlEnabled()) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = simulationControlSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid simulation control request." }, { status: 400 });
    }

    const service = getSimulationEngineService();
    await service.ensureInitialized();

    switch (parsed.data.action) {
      case "start":
        service.start();
        break;
      case "pause":
        service.pause();
        break;
      case "reset":
        await service.reset(parsed.data.seed ?? undefined);
        break;
      case "speed":
        if (
          parsed.data.speedMultiplier &&
          ALLOWED_SPEED_MULTIPLIERS.includes(
            parsed.data.speedMultiplier as (typeof ALLOWED_SPEED_MULTIPLIERS)[number],
          )
        ) {
          service.setSpeed(parsed.data.speedMultiplier);
        } else {
          return NextResponse.json({ error: "Invalid speed multiplier." }, { status: 400 });
        }
        break;
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    const status = await service.getStatus();
    return NextResponse.json({ success: true, status });
  } catch (error) {
    logServerError("Simulation control failed", error);
    return NextResponse.json(
      { error: "Unable to control market simulation." },
      { status: 500 },
    );
  }
}
