import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, ForbiddenError, UnauthorizedError, ROLES } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  username: z.string().min(1).max(200).optional(),
  password: z.string().min(1).optional(),
  url: z.string().url().optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();

    const credential = await prisma.secCredential.findFirst({
      where: { id: params.id, deletedAt: null },
      select: {
        id: true,
        name: true,
        username: true,
        url: true,
        notes: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        owner: { select: { name: true, lastname: true } },
      },
    });

    if (!credential)
      return NextResponse.json({ message: "Credencial no encontrada" }, { status: 404 });

    if (
      session.role === ROLES.TECNICO &&
      credential.ownerId !== session.userId
    ) throw new ForbiddenError();

    if (![ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.TECNICO].includes(session.role as never))
      throw new ForbiddenError("Sin acceso al módulo de credenciales");

    return NextResponse.json({ credential });
  } catch (error) {
    if (error instanceof UnauthorizedError)
      return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)
      return NextResponse.json({ message: error.message }, { status: 403 });
    console.error("[CREDENTIAL GET]", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();

    if (![ROLES.ADMIN, ROLES.SUPERVISOR].includes(session.role as never))
      throw new ForbiddenError("Solo Administrador y Supervisor pueden editar credenciales");

    const credential = await prisma.secCredential.findFirst({
      where: { id: params.id, deletedAt: null },
    });

    if (!credential)
      return NextResponse.json({ message: "Credencial no encontrada" }, { status: 404 });

    const body = await req.json();
    const data = updateSchema.parse(body);

    const encryptedFields =
      data.password ? encrypt(data.password) : null;

    const updated = await prisma.secCredential.update({
      where: { id: params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.username && { username: data.username }),
        ...(encryptedFields && {
          encryptedPassword: encryptedFields.encrypted,
          encryptionIv: encryptedFields.iv,
        }),
        ...(data.url !== undefined && { url: data.url || null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        ...(data.expiresAt !== undefined && {
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        }),
        updatedBy: session.userId,
      },
      select: {
        id: true, name: true, username: true,
        url: true, notes: true, expiresAt: true, updatedAt: true,
      },
    });

    return NextResponse.json({ credential: updated });
  } catch (error) {
    if (error instanceof UnauthorizedError)
      return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)
      return NextResponse.json({ message: error.message }, { status: 403 });
    if (error instanceof z.ZodError)
      return NextResponse.json({ message: "Datos inválidos", errors: error.issues }, { status: 400 });
    console.error("[CREDENTIAL PATCH]", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();

    if (![ROLES.ADMIN, ROLES.SUPERVISOR].includes(session.role as never))
      throw new ForbiddenError("Solo Administrador y Supervisor pueden eliminar credenciales");

    const credential = await prisma.secCredential.findFirst({
      where: { id: params.id, deletedAt: null },
    });

    if (!credential)
      return NextResponse.json({ message: "Credencial no encontrada" }, { status: 404 });

    await prisma.secCredential.update({
      where: { id: params.id },
      data: { deletedAt: new Date(), deletedBy: session.userId },
    });

    return NextResponse.json({ message: "Credencial eliminada" });
  } catch (error) {
    if (error instanceof UnauthorizedError)
      return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)
      return NextResponse.json({ message: error.message }, { status: 403 });
    console.error("[CREDENTIAL DELETE]", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
