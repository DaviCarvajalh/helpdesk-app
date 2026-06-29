import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, ForbiddenError, UnauthorizedError, ROLES } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  isClosed: z.boolean().optional().default(false),
});

export async function GET() {
  try {
    await requireRole([ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.TECNICO]);
    const statuses = await prisma.cfgStatus.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ statuses });
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
    const existing = await prisma.cfgStatus.findUnique({ where: { name: data.name } });
    if (existing) return NextResponse.json({ message: "Ya existe un estado con ese nombre" }, { status: 409 });
    const status = await prisma.cfgStatus.create({ data });
    return NextResponse.json({ status }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    if (error instanceof z.ZodError)        return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
