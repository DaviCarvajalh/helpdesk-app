import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError, ForbiddenError, ROLES } from "@/lib/auth";

const createSchema = z.object({
  title:      z.string().min(1).max(200),
  content:    z.string().min(1),
  categoryId: z.string().optional(),
  published:  z.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const q          = searchParams.get("q")          ?? "";
    const categoryId = searchParams.get("categoryId") ?? "";
    const onlyPublished = searchParams.get("published") === "true";

    const articles = await prisma.kbArticle.findMany({
      where: {
        deletedAt: null,
        ...(onlyPublished ? { published: true } : {}),
        ...(categoryId    ? { categoryId }       : {}),
        ...(q ? {
          OR: [
            { title:   { contains: q, mode: "insensitive" } },
            { content: { contains: q, mode: "insensitive" } },
          ],
        } : {}),
      },
      select: {
        id: true, title: true, published: true,
        views: true, createdAt: true, updatedAt: true,
        category: { select: { id: true, name: true } },
        author:   { select: { id: true, name: true, lastname: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ articles });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.role === ROLES.USUARIO) throw new ForbiddenError("Sin permisos");

    const body = await req.json();
    const data = createSchema.parse(body);

    const article = await prisma.kbArticle.create({
      data: {
        title:      data.title,
        content:    data.content,
        categoryId: data.categoryId ?? null,
        authorId:   session.userId,
        published:  data.published,
        createdBy:  session.userId,
      },
      include: {
        category: { select: { id: true, name: true } },
        author:   { select: { id: true, name: true, lastname: true } },
      },
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    if (error instanceof z.ZodError)        return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    console.error("[CONOCIMIENTO POST]", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
