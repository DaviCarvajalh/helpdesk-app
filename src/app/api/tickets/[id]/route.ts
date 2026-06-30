import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError, ForbiddenError, ROLES } from "@/lib/auth";

const patchSchema = z.object({
  statusId:   z.string().optional(),
  assigneeId: z.string().nullable().optional(),
  priorityId: z.string().optional(),
  title:       z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
}).strict();

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();

    const ticket = await prisma.hdTicket.findFirst({
      where: {
        id: params.id,
        deletedAt: null,
        ...(session.role === ROLES.USUARIO ? { requesterId: session.userId } : {}),
      },
      include: {
        requester:  { select: { id: true, name: true, lastname: true, email: true } },
        assignee:   { select: { id: true, name: true, lastname: true } },
        priority:   true,
        status:     true,
        category:   true,
        comments: {
          include: { user: { select: { id: true, name: true, lastname: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) return NextResponse.json({ message: "Ticket no encontrado" }, { status: 404 });

    return NextResponse.json({ ticket });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    console.error("[TICKET GET]", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    if (session.role === ROLES.USUARIO) throw new ForbiddenError("Sin permisos para modificar tickets");

    const body  = await req.json();
    const data  = patchSchema.parse(body);

    const ticket = await prisma.hdTicket.findFirst({ where: { id: params.id, deletedAt: null } });
    if (!ticket) return NextResponse.json({ message: "Ticket no encontrado" }, { status: 404 });

    const updated = await prisma.hdTicket.update({
      where: { id: params.id },
      data: { ...data, updatedBy: session.userId } as object,
      include: {
        requester: { select: { id: true, name: true, lastname: true } },
        assignee:  { select: { id: true, name: true, lastname: true } },
        priority:  true,
        status:    true,
        category:  true,
      },
    });

    return NextResponse.json({ ticket: updated });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    if (error instanceof z.ZodError)        return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    console.error("[TICKET PATCH]", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    if (![ROLES.ADMIN, ROLES.SUPERVISOR].includes(session.role as typeof ROLES.ADMIN)) {
      throw new ForbiddenError("Sin permisos para eliminar tickets");
    }

    await prisma.hdTicket.update({
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
