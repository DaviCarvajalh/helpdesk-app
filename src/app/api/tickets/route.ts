import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

const createTicketSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  priority: z.string().default("Media"),
  category: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const tickets = await prisma.hdTicket.findMany({
      where: {
        deletedAt: null,
        ...(status ? { status: { name: status } } : {}),
        ...(priority ? { priority: { name: priority } } : {}),
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
    const body = await req.json();
    const data = createTicketSchema.parse(body);

    const [priorityRecord, statusRecord] = await Promise.all([
      prisma.cfgPriority.findFirst({ where: { name: data.priority } }),
      prisma.cfgStatus.findFirst({ where: { name: "Nuevo" } }),
    ]);

    if (!priorityRecord || !statusRecord) {
      return NextResponse.json(
        { message: "Configuración de prioridad/estado no encontrada" },
        { status: 400 }
      );
    }

    const count = await prisma.hdTicket.count();
    const ticketNumber = `HD-${String(count + 1).padStart(5, "0")}`;

    const ticket = await prisma.hdTicket.create({
      data: {
        ticketNumber,
        title: data.title,
        description: data.description,
        requesterId: session.userId,
        priorityId: priorityRecord.id,
        statusId: statusRecord.id,
        ...(data.category
          ? {
              category: {
                connectOrCreate: {
                  where: { name: data.category },
                  create: { name: data.category },
                },
              },
            }
          : {}),
      },
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: error.issues },
        { status: 400 }
      );
    }
    console.error("[TICKETS POST]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
