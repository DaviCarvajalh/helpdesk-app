import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole, ForbiddenError, UnauthorizedError, ROLES } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  lastname: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  roleId: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireRole([ROLES.ADMIN]);

    const existing = await prisma.secUser.findFirst({
      where: { id: params.id, deletedAt: null },
    });
    if (!existing) return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });

    const body = await req.json();
    const data = updateSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (data.name)     updateData.name = data.name;
    if (data.lastname) updateData.lastname = data.lastname;
    if (data.email)    updateData.email = data.email;
    if (data.roleId)   updateData.roleId = data.roleId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 12);
    updateData.updatedBy = session.userId;

    const user = await prisma.secUser.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true, name: true, lastname: true, email: true,
        isActive: true, updatedAt: true,
        role: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    if (error instanceof z.ZodError)        return NextResponse.json({ message: "Datos inválidos", errors: error.issues }, { status: 400 });
    console.error("[ADMIN USER PATCH]", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireRole([ROLES.ADMIN]);

    const existing = await prisma.secUser.findFirst({
      where: { id: params.id, deletedAt: null },
    });
    if (!existing) return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });

    // No permitir auto-eliminación
    if (existing.id === session.userId) {
      return NextResponse.json({ message: "No puedes eliminar tu propia cuenta" }, { status: 400 });
    }

    await prisma.secUser.update({
      where: { id: params.id },
      data: { deletedAt: new Date(), deletedBy: session.userId, isActive: false },
    });

    return NextResponse.json({ message: "Usuario eliminado" });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    console.error("[ADMIN USER DELETE]", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
