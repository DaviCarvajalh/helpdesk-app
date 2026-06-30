import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError, ForbiddenError, ROLES } from "@/lib/auth";

const patchSchema = z.object({
  name:         z.string().min(1).max(200).optional(),
  brand:        z.string().optional(),
  model:        z.string().optional(),
  serialNumber: z.string().optional(),
  categoryId:   z.string().optional(),
  status:       z.enum(["active", "maintenance", "retired", "storage"]).optional(),
  location:     z.string().optional(),
  assignedTo:   z.string().nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
  warrantyEnd:  z.string().nullable().optional(),
  notes:        z.string().optional(),
}).strict();

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const asset = await prisma.invAsset.findFirst({ where: { id: params.id, deletedAt: null } });
    if (!asset) return NextResponse.json({ message: "Activo no encontrado" }, { status: 404 });

    // Resolver usuario asignado
    const assignee = asset.assignedTo
      ? await prisma.secUser.findUnique({
          where: { id: asset.assignedTo },
          select: { id: true, name: true, lastname: true, email: true },
        })
      : null;

    return NextResponse.json({ asset: { ...asset, assignee } });
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

    const asset = await prisma.invAsset.findFirst({ where: { id: params.id, deletedAt: null } });
    if (!asset) return NextResponse.json({ message: "Activo no encontrado" }, { status: 404 });

    const updated = await prisma.invAsset.update({
      where: { id: params.id },
      data: {
        ...data,
        purchaseDate: data.purchaseDate === null ? null : data.purchaseDate ? new Date(data.purchaseDate) : undefined,
        warrantyEnd:  data.warrantyEnd  === null ? null : data.warrantyEnd  ? new Date(data.warrantyEnd)  : undefined,
        updatedBy: session.userId,
      } as object,
    });

    return NextResponse.json({ asset: updated });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    if (error instanceof z.ZodError)        return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    console.error("[INVENTARIO PATCH]", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    if (![ROLES.ADMIN, ROLES.SUPERVISOR].includes(session.role as typeof ROLES.ADMIN)) {
      throw new ForbiddenError("Sin permisos");
    }
    await prisma.invAsset.update({
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
