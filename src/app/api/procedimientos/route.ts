import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError, ForbiddenError, ROLES } from "@/lib/auth";

const stepSchema = z.object({
  title:     z.string().min(1).max(200),
  content:   z.string().optional(),
  isWarning: z.boolean().optional().default(false),
  order:     z.number().int().min(0),
});

const createSchema = z.object({
  title:       z.string().min(1).max(200),
  description: z.string().optional(),
  category:    z.string().optional(),
  isPublished: z.boolean().optional().default(false),
  steps:       z.array(stepSchema).optional().default([]),
});

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const q        = searchParams.get("q") ?? "";
    const category = searchParams.get("category") ?? "";

    const procedures = await prisma.kbProcedure.findMany({
      where: {
        deletedAt: null,
        ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
        ...(category ? { category } : {}),
      },
      include: {
        steps: { orderBy: { order: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ procedures });
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

    const procedure = await prisma.kbProcedure.create({
      data: {
        title:       data.title,
        description: data.description,
        category:    data.category,
        isPublished: data.isPublished,
        createdBy:   session.userId,
        steps: {
          create: data.steps.map((s) => ({
            order:     s.order,
            title:     s.title,
            content:   s.content,
            isWarning: s.isWarning,
          })),
        },
      },
      include: { steps: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ procedure }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    if (error instanceof z.ZodError)        return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    console.error("[PROCEDIMIENTOS POST]", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
