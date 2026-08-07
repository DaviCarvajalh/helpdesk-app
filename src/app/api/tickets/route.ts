import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requireSession,
  ForbiddenError,
  UnauthorizedError,
  ROLES,
} from "@/lib/auth";
import { sendTicketCreated } from "@/lib/email";

const createTicketSchema = z.object({
  type: z.enum(["incidente", "requerimiento"]).default("incidente"),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  priorityId: z.string().min(1),
  categoryId: z.string().optional(),
  assigneeId: z.string().optional(),
  requesterId: z.string().optional(), // override: reportar en nombre de otro usuario
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const status   = searchParams.get("status");
    const priority = searchParams.get("priority");
    const q        = searchParams.get("q")?.trim() ?? "";

    // Usuario Final solo puede ver sus propios tickets
    const ownerFilter =
      session.role === ROLES.USUARIO
        ? { requesterId: session.userId }
        : {};

    const tickets = await prisma.hdTicket.findMany({
      where: {
        deletedAt: null,
        ...ownerFilter,
        ...(status   ? { status:   { name: status }   } : {}),
        ...(priority ? { priority: { name: priority } } : {}),
        ...(q ? {
          OR: [
            { title:        { contains: q, mode: "insensitive" } },
            { ticketNumber: { contains: q, mode: "insensitive" } },
            { description:  { contains: q, mode: "insensitive" } },
            { requester: { name: { contains: q, mode: "insensitive" } } },
          ],
        } : {}),
      },
      include: {
        requester: { select: { name: true, lastname: true } },
        assignee: { select: { name: true, lastname: true } },
        priority: true,
        status: true,
        category: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    console.error("[TICKETS GET]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();

    if (session.role === ROLES.AUDITOR) {
      throw new ForbiddenError("Los auditores no pueden crear tickets");
    }

    const body = await req.json();
    const data = createTicketSchema.parse(body);

    // Solo Admin/Supervisor pueden reportar en nombre de otro usuario
    const canOverrideRequester = [ROLES.ADMIN, ROLES.SUPERVISOR].includes(session.role as typeof ROLES.ADMIN);
    const requesterId = (canOverrideRequester && data.requesterId) ? data.requesterId : session.userId;

    const [priorityRecord, statusRecord] = await Promise.all([
      prisma.cfgPriority.findUnique({ where: { id: data.priorityId } }),
      prisma.cfgStatus.findFirst({ where: { name: "Nuevo" } }),
    ]);

    if (!priorityRecord) return NextResponse.json({ message: "Prioridad no encontrada" }, { status: 400 });
    if (!statusRecord)   return NextResponse.json({ message: "Estado 'Nuevo' no configurado en el sistema" }, { status: 400 });

    const priority = priorityRecord;
    const status = statusRecord;

    // SLA deadline: ahora + resolveTime horas de la prioridad
    const slaDeadline = priority.resolveTime > 0
      ? new Date(Date.now() + priority.resolveTime * 60 * 60 * 1000)
      : null;

    // El ticketNumber tiene un índice @unique. Ante creaciones concurrentes
    // dos peticiones podrían calcular el mismo número, por lo que reintentamos
    // si Prisma lanza P2002 (violación de restricción única).
    async function createTicketWithNumber() {
      for (let attempt = 0; attempt < 5; attempt++) {
        const count = await prisma.hdTicket.count();
        const ticketNumber = `HD-${String(count + 1 + attempt).padStart(5, "0")}`;
        try {
          return await prisma.hdTicket.create({
            data: {
              ticketNumber,
              type: data.type,
              title: data.title,
              description: data.description,
              requesterId,
              priorityId: priority.id,
              statusId: status.id,
              assigneeId: data.assigneeId || null,
              categoryId: data.categoryId || null,
              slaDeadline,
              createdBy: session.userId,
            } as Parameters<typeof prisma.hdTicket.create>[0]["data"],
            include: {
              requester: { select: { name: true, lastname: true } },
              priority: true,
              status: true,
              category: true,
            },
          });
        } catch (err) {
          if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            continue; // colisión de ticketNumber → reintentar
          }
          throw err;
        }
      }
      throw new Error("No se pudo generar un número de ticket único tras varios intentos");
    }

    const ticket = await createTicketWithNumber();

    // Email al solicitante (fire-and-forget)
    prisma.secUser.findUnique({ where: { id: requesterId }, select: { email: true, name: true, lastname: true } })
      .then((u) => {
        if (u?.email) sendTicketCreated({
          to: u.email, name: `${u.name} ${u.lastname}`,
          ticketNumber: ticket.ticketNumber, ticketId: ticket.id,
          title: ticket.title, priority: priority.name,
        });
      }).catch(() => {});

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Datos inválidos", errors: error.issues }, { status: 400 });
    }
    console.error("[TICKETS POST]", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
