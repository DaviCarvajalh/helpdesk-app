import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole, ForbiddenError, UnauthorizedError, ROLES } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  lastname: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  roleId: z.string().min(1),
  isActive: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    await requireRole([ROLES.ADMIN, ROLES.SUPERVISOR]);

    const users = await prisma.secUser.findMany({
      where: { deletedAt: null },
      select: {
        id: true, name: true, lastname: true, email: true,
        isActive: true, createdAt: true,
        role: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    console.error("[ADMIN USERS GET]", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole([ROLES.ADMIN]);

    const body = await req.json();
    const data = createSchema.parse(body);

    const existing = await prisma.secUser.findUnique({ where: { email: data.email } });
    if (existing) return NextResponse.json({ message: "El email ya está registrado" }, { status: 409 });

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.secUser.create({
      data: {
        name: data.name,
        lastname: data.lastname,
        email: data.email,
        passwordHash,
        roleId: data.roleId,
        isActive: data.isActive,
      },
      select: {
        id: true, name: true, lastname: true, email: true,
        isActive: true, createdAt: true,
        role: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    if (error instanceof z.ZodError)        return NextResponse.json({ message: "Datos inválidos", errors: error.issues }, { status: 400 });
    console.error("[ADMIN USERS POST]", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
