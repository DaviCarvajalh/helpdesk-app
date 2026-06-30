import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError, ForbiddenError, ROLES } from "@/lib/auth";

export async function GET() {
  try {
    await requireSession();
    const categories = await prisma.kbCategory.findMany({
      include: {
        _count: {
          select: { articles: { where: { deletedAt: null } } },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (![ROLES.ADMIN, ROLES.SUPERVISOR].includes(session.role as typeof ROLES.ADMIN)) {
      throw new ForbiddenError("Sin permisos");
    }
    const { name } = z.object({ name: z.string().min(1).max(100) }).parse(await req.json());
    const category = await prisma.kbCategory.create({ data: { name } });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    if (error instanceof z.ZodError)        return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
