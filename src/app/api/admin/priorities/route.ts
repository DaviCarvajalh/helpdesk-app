import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, ForbiddenError, UnauthorizedError, ROLES } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1).max(50),
  level: z.number().int().min(1).max(10),
  responseTime: z.number().int().min(0),
  resolveTime: z.number().int().min(0),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function GET() {
  try {
    await requireRole([ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.TECNICO]);
    const priorities = await prisma.cfgPriority.findMany({ orderBy: { level: "asc" } });
    return NextResponse.json({ priorities });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole([ROLES.ADMIN]);
    const data = schema.parse(await req.json());
    const existing = await prisma.cfgPriority.findUnique({ where: { name: data.name } });
    if (existing) return NextResponse.json({ message: "Ya existe una prioridad con ese nombre" }, { status: 409 });
    const priority = await prisma.cfgPriority.create({ data });
    return NextResponse.json({ priority }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    if (error instanceof z.ZodError)        return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
