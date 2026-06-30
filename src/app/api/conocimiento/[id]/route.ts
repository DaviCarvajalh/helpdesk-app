import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError, ForbiddenError, ROLES } from "@/lib/auth";

const patchSchema = z.object({
  title:      z.string().min(1).max(200).optional(),
  content:    z.string().min(1).optional(),
  categoryId: z.string().nullable().optional(),
  published:  z.boolean().optional(),
}).strict();

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const article = await prisma.kbArticle.findFirst({
      where: { id: params.id, deletedAt: null },
      include: {
        category: { select: { id: true, name: true } },
        author:   { select: { id: true, name: true, lastname: true } },
      },
    });
    if (!article) return NextResponse.json({ message: "No encontrado" }, { status: 404 });

    // Incrementar vistas
    await prisma.kbArticle.update({
      where: { id: params.id },
      data:  { views: { increment: 1 } },
    });

    return NextResponse.json({ article: { ...article, views: article.views + 1 } });
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

    const existing = await prisma.kbArticle.findFirst({ where: { id: params.id, deletedAt: null } });
    if (!existing) return NextResponse.json({ message: "No encontrado" }, { status: 404 });

    const updated = await prisma.kbArticle.update({
      where: { id: params.id },
      data: { ...data, updatedBy: session.userId } as object,
      include: {
        category: { select: { id: true, name: true } },
        author:   { select: { id: true, name: true, lastname: true } },
      },
    });

    return NextResponse.json({ article: updated });
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
    await prisma.kbArticle.update({
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
