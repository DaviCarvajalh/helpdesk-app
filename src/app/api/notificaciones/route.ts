import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError } from "@/lib/auth";

export async function GET() {
  try {
    await requireSession();
    const now   = new Date();
    const in30  = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [slaBreached, unassigned, contractsExpiring, credsExpiring] = await Promise.all([
      // Tickets con SLA vencido y aún abiertos
      prisma.hdTicket.findMany({
        where: { deletedAt: null, status: { isClosed: false }, slaDeadline: { lt: now } },
        select: { id: true, ticketNumber: true, title: true, slaDeadline: true },
        orderBy: { slaDeadline: "asc" },
        take: 5,
      }),
      // Tickets sin asignar
      prisma.hdTicket.count({
        where: { deletedAt: null, assigneeId: null, status: { isClosed: false } },
      }),
      // Contratos por vencer en 30 días
      prisma.hdContract.findMany({
        where: {
          deletedAt: null,
          status: { not: "cancelled" },
          endDate: { gt: now, lt: in30 },
        },
        select: { id: true, contractNumber: true, endDate: true, customer: { select: { name: true } } },
        orderBy: { endDate: "asc" },
        take: 5,
      }),
      // Credenciales por vencer en 30 días
      prisma.secCredential.count({
        where: { deletedAt: null, expiresAt: { gt: now, lt: in30 } },
      }),
    ]);

    const items = [
      ...slaBreached.map((t) => ({
        type:  "sla",
        label: `SLA vencido: ${t.ticketNumber}`,
        sub:   t.title,
        href:  `/tickets/${t.id}`,
        level: "error" as const,
      })),
      ...(unassigned > 0 ? [{
        type:  "unassigned",
        label: `${unassigned} ticket${unassigned > 1 ? "s" : ""} sin asignar`,
        sub:   "Requieren atención",
        href:  "/tickets?status=Nuevo",
        level: "warn" as const,
      }] : []),
      ...contractsExpiring.map((c) => ({
        type:  "contract",
        label: `Contrato por vencer: ${c.contractNumber}`,
        sub:   `${c.customer.name} — ${new Date(c.endDate).toLocaleDateString("es-CL")}`,
        href:  `/contratos/${c.id}`,
        level: "warn" as const,
      })),
      ...(credsExpiring > 0 ? [{
        type:  "credentials",
        label: `${credsExpiring} credencial${credsExpiring > 1 ? "es" : ""} por vencer`,
        sub:   "Menos de 30 días",
        href:  "/credenciales",
        level: "warn" as const,
      }] : []),
    ];

    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    if (error instanceof UnauthorizedError)
      return NextResponse.json({ message: error.message }, { status: 401 });
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
