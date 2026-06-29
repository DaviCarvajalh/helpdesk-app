import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, ForbiddenError, UnauthorizedError, ROLES } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1).max(50).optional(),
  level: z.number().int().min(1).max(10).optional(),
  responseTime: z.number().int().min(0).optional(),
  resolveTime: z.number().int().min(0).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireRole([ROLES.ADMIN]);
    const data = schema.parse(await req.json());
    const priority = await prisma.cfgPriority.update({ where: { id: params.id }, data });
    return NextResponse.json({ priority });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    if (error instanceof z.ZodError)        return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireRole([ROLES.ADMIN]);
    await prisma.cfgPriority.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Prioridad eliminada" });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
