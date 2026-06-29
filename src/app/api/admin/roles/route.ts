import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, ForbiddenError, UnauthorizedError, ROLES } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole([ROLES.ADMIN, ROLES.SUPERVISOR]);
    const roles = await prisma.secRole.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ roles });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
