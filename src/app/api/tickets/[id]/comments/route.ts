import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError, ForbiddenError, ROLES } from "@/lib/auth";

const schema = z.object({
  content:    z.string().min(1),
  isInternal: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const data = schema.parse(body);

    // Usuarios finales no pueden poner notas internas
    if (data.isInternal && session.role === ROLES.USUARIO) {
      throw new ForbiddenError("Sin permisos para notas internas");
    }

    const ticket = await prisma.hdTicket.findFirst({ where: { id: params.id, deletedAt: null } });
    if (!ticket) return NextResponse.json({ message: "Ticket no encontrado" }, { status: 404 });

    const comment = await prisma.hdTicketComment.create({
      data: {
        ticketId:   params.id,
        userId:     session.userId,
        content:    data.content,
        isInternal: data.isInternal,
      },
      include: { user: { select: { id: true, name: true, lastname: true } } },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    if (error instanceof z.ZodError)        return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    console.error("[COMMENTS POST]", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
