import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    project: "DEFINN",
    phase: "foundation",
  });
}
