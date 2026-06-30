import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError, ROLES } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireSession();

    const canSeeAllUsers = [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.TECNICO].includes(
      session.role as typeof ROLES.ADMIN
    );

    const [categories, priorities, technicians, users] = await Promise.all([
      prisma.cfgCategory.findMany({ orderBy: { name: "asc" } }),
      prisma.cfgPriority.findMany({ orderBy: { level: "asc" } }),
      // Técnicos y supervisores para asignar
      prisma.secUser.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          role: { name: { in: [ROLES.TECNICO, ROLES.SUPERVISOR, ROLES.ADMIN] } },
        },
        select: { id: true, name: true, lastname: true, role: { select: { name: true } } },
        orderBy: [{ name: "asc" }],
      }),
      // Usuarios para "quién reporta" (solo roles que pueden ver)
      canSeeAllUsers
        ? prisma.secUser.findMany({
            where: { deletedAt: null, isActive: true },
            select: { id: true, name: true, lastname: true },
            orderBy: [{ name: "asc" }],
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({ categories, priorities, technicians, users });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
