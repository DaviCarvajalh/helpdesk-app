import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, ForbiddenError, UnauthorizedError, ROLES } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  username: z.string().min(1).max(200),
  password: z.string().min(1),
  url: z.string().url().optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
});

const ALLOWED_ROLES: string[] = [
  ROLES.ADMIN,
  ROLES.SUPERVISOR,
  ROLES.TECNICO,
];

export async function GET() {
  try {
    const session = await requireSession();

    if (!ALLOWED_ROLES.includes(session.role)) {
      throw new ForbiddenError("Sin acceso al módulo de credenciales");
    }

    const where =
      session.role === ROLES.TECNICO
        ? { deletedAt: null, ownerId: session.userId }
        : { deletedAt: null };

    const credentials = await prisma.secCredential.findMany({
      where,
      select: {
        id: true,
        name: true,
        username: true,
        url: true,
        notes: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        owner: { select: { name: true, lastname: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ credentials });
  } catch (error) {
    if (error instanceof UnauthorizedError)
      return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)
      return NextResponse.json({ message: error.message }, { status: 403 });
    console.error("[CREDENTIALS GET]", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();

    if (![ROLES.ADMIN, ROLES.SUPERVISOR].includes(session.role as never)) {
      throw new ForbiddenError("Solo Administrador y Supervisor pueden crear credenciales");
    }

    const body = await req.json();
    const data = createSchema.parse(body);

    const { encrypted, iv } = encrypt(data.password);

    const credential = await prisma.secCredential.create({
      data: {
        name: data.name,
        username: data.username,
        encryptedPassword: encrypted,
        encryptionIv: iv,
        url: data.url || null,
        notes: data.notes || null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        ownerId: session.userId,
        createdBy: session.userId,
      },
      select: {
        id: true,
        name: true,
        username: true,
        url: true,
        notes: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ credential }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError)
      return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)
      return NextResponse.json({ message: error.message }, { status: 403 });
    if (error instanceof z.ZodError)
      return NextResponse.json({ message: "Datos inválidos", errors: error.issues }, { status: 400 });
    console.error("[CREDENTIALS POST]", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
