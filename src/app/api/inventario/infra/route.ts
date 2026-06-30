import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError, ForbiddenError, ROLES } from "@/lib/auth";

const createSchema = z.object({
  hostname:        z.string().min(1).max(200),
  ipAddress:       z.string().optional(),
  operatingSystem: z.string().optional(),
  environment:     z.enum(["production", "staging", "development", "testing"]).optional(),
  ownerId:         z.string().nullable().optional(),
  criticality:     z.enum(["critical", "high", "medium", "low"]).optional(),
  notes:           z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";

    const assets = await prisma.invInfraAsset.findMany({
      where: {
        deletedAt: null,
        ...(q ? {
          OR: [
            { hostname:  { contains: q, mode: "insensitive" } },
            { ipAddress: { contains: q, mode: "insensitive" } },
          ],
        } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ assets });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.role === ROLES.USUARIO) throw new ForbiddenError("Sin permisos");

    const body = await req.json();
    const data = createSchema.parse(body);

    const asset = await prisma.invInfraAsset.create({
      data: {
        hostname:        data.hostname,
        ipAddress:       data.ipAddress,
        operatingSystem: data.operatingSystem,
        environment:     data.environment,
        ownerId:         data.ownerId ?? null,
        criticality:     data.criticality,
        notes:           data.notes,
      },
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    if (error instanceof z.ZodError)        return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
