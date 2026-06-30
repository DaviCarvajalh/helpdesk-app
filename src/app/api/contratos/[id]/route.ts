import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError, ForbiddenError, ROLES } from "@/lib/auth";

const patchSchema = z.object({
  startDate: z.string().optional(),
  endDate:   z.string().optional(),
  amount:    z.number().positive().nullable().optional(),
  status:    z.enum(["active", "expired", "cancelled", "draft"]).optional(),
  notes:     z.string().optional(),
}).strict();

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const contract = await prisma.hdContract.findFirst({
      where: { id: params.id, deletedAt: null },
      include: { customer: true },
    });
    if (!contract) return NextResponse.json({ message: "No encontrado" }, { status: 404 });
    return NextResponse.json({ contract });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    if (session.role === ROLES.USUARIO) throw new ForbiddenError("Sin permisos");

    const body = await req.json();
    const data = patchSchema.parse(body);

    const existing = await prisma.hdContract.findFirst({ where: { id: params.id, deletedAt: null } });
    if (!existing) return NextResponse.json({ message: "No encontrado" }, { status: 404 });

    const updated = await prisma.hdContract.update({
      where: { id: params.id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate:   data.endDate   ? new Date(data.endDate)   : undefined,
        updatedBy: session.userId,
      } as object,
      include: { customer: true },
    });

    return NextResponse.json({ contract: updated });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    if (error instanceof z.ZodError)        return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    if (![ROLES.ADMIN, ROLES.SUPERVISOR].includes(session.role as typeof ROLES.ADMIN)) {
      throw new ForbiddenError("Sin permisos");
    }
    await prisma.hdContract.update({
      where: { id: params.id },
      data: { deletedAt: new Date(), updatedBy: session.userId },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
