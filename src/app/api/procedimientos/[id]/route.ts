import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError, ForbiddenError, ROLES } from "@/lib/auth";

const stepSchema = z.object({
  id:        z.string().optional(),
  title:     z.string().min(1).max(200),
  content:   z.string().optional(),
  isWarning: z.boolean().optional().default(false),
  order:     z.number().int().min(0),
});

const patchSchema = z.object({
  title:       z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  category:    z.string().optional(),
  isPublished: z.boolean().optional(),
  steps:       z.array(stepSchema).optional(),
}).strict();

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const procedure = await prisma.kbProcedure.findFirst({
      where: { id: params.id, deletedAt: null },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    if (!procedure) return NextResponse.json({ message: "No encontrado" }, { status: 404 });
    return NextResponse.json({ procedure });
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

    const existing = await prisma.kbProcedure.findFirst({ where: { id: params.id, deletedAt: null } });
    if (!existing) return NextResponse.json({ message: "No encontrado" }, { status: 404 });

    const { steps, ...fields } = data;

    await prisma.$transaction(async (tx) => {
      await tx.kbProcedure.update({
        where: { id: params.id },
        data: { ...fields, updatedBy: session.userId },
      });

      if (steps !== undefined) {
        // Reemplazar todos los pasos
        await tx.kbProcedureStep.deleteMany({ where: { procedureId: params.id } });
        if (steps.length > 0) {
          await tx.kbProcedureStep.createMany({
            data: steps.map((s) => ({
              procedureId: params.id,
              order:       s.order,
              title:       s.title,
              content:     s.content ?? null,
              isWarning:   s.isWarning ?? false,
            })),
          });
        }
      }
    });

    const updated = await prisma.kbProcedure.findUnique({
      where: { id: params.id },
      include: { steps: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ procedure: updated });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    if (error instanceof z.ZodError)        return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    console.error("[PROCEDIMIENTOS PATCH]", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    if (![ROLES.ADMIN, ROLES.SUPERVISOR].includes(session.role as typeof ROLES.ADMIN)) {
      throw new ForbiddenError("Sin permisos");
    }
    await prisma.kbProcedure.update({
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
