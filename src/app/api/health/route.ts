import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      database: "up",
      uptime: process.uptime(),
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[HEALTH]", error);
    return NextResponse.json(
      {
        status: "error",
        database: "down",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
