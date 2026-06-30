import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") ?? "30", 10);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      // Tickets stats
      totalTickets,
      openTickets,
      closedInRange,
      slaBreached,
      ticketsByStatus,
      ticketsByCategory,
      ticketsByPriority,
      techLoad,
      // Tendencia diaria (últimos 14 días)
      dailyTickets,
      // Cross-module
      contractsExpiring,
      assetsInMaintenance,
      credsExpiring,
    ] = await Promise.all([
      // Total tickets del período
      prisma.hdTicket.count({ where: { deletedAt: null, createdAt: { gte: since } } }),

      // Tickets abiertos actualmente
      prisma.hdTicket.count({
        where: { deletedAt: null, status: { isClosed: false } },
      }),

      // Cerrados en el período
      prisma.hdTicket.count({
        where: { deletedAt: null, status: { isClosed: true }, closedAt: { gte: since } },
      }),

      // SLA vencido (deadline pasado y aún abierto)
      prisma.hdTicket.count({
        where: {
          deletedAt: null,
          status: { isClosed: false },
          slaDeadline: { lt: new Date() },
        },
      }),

      // Por estado
      prisma.cfgStatus.findMany({
        select: {
          name: true, color: true,
          _count: { select: { tickets: { where: { deletedAt: null } } } },
        },
      }),

      // Por categoría (últimos N días)
      prisma.cfgCategory.findMany({
        select: {
          name: true, color: true,
          _count: { select: { tickets: { where: { deletedAt: null, createdAt: { gte: since } } } } },
        },
      }),

      // Por prioridad
      prisma.cfgPriority.findMany({
        select: {
          name: true, color: true, level: true,
          _count: { select: { tickets: { where: { deletedAt: null, createdAt: { gte: since } } } } },
        },
        orderBy: { level: "asc" },
      }),

      // Carga por técnico
      prisma.secUser.findMany({
        where: {
          deletedAt: null, isActive: true,
          role: { name: { in: ["Técnico", "Supervisor"] } },
        },
        select: {
          id: true, name: true, lastname: true,
          _count: {
            select: {
              ticketsAssigned: { where: { deletedAt: null, status: { isClosed: false } } },
            },
          },
        },
        orderBy: { name: "asc" },
      }),

      // Tendencia diaria últimos 14 días
      prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT DATE_TRUNC('day', created_at) as day, COUNT(*) as count
        FROM hd_ticket
        WHERE deleted_at IS NULL
          AND created_at >= NOW() - INTERVAL '14 days'
        GROUP BY day
        ORDER BY day ASC
      `,

      // Contratos por vencer en 30 días
      prisma.hdContract.count({
        where: {
          deletedAt: null,
          status: { not: "cancelled" },
          endDate: { gt: new Date(), lt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
      }),

      // Activos en mantención
      prisma.invAsset.count({ where: { deletedAt: null, status: "maintenance" } }),

      // Credenciales por vencer en 30 días
      prisma.secCredential.count({
        where: {
          deletedAt: null,
          expiresAt: { gt: new Date(), lt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    // Calcular resolución promedio (para tickets cerrados con closedAt)
    const closedWithTime = await prisma.hdTicket.findMany({
      where: { deletedAt: null, closedAt: { gte: since, not: null }, status: { isClosed: true } },
      select: { createdAt: true, closedAt: true },
      take: 100,
    });
    const avgResolutionH = closedWithTime.length
      ? Math.round(
          closedWithTime.reduce((sum, t) => {
            const diff = (t.closedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
            return sum + diff;
          }, 0) / closedWithTime.length
        )
      : null;

    // SLA cumplimiento %
    const ticketsWithSla = await prisma.hdTicket.count({
      where: { deletedAt: null, createdAt: { gte: since }, slaDeadline: { not: null } },
    });
    const slaCompliance = ticketsWithSla > 0
      ? Math.round(((ticketsWithSla - slaBreached) / ticketsWithSla) * 100)
      : null;

    return NextResponse.json({
      period: { days, since },
      kpis: {
        totalTickets,
        openTickets,
        closedInRange,
        slaBreached,
        slaCompliance,
        avgResolutionH,
      },
      breakdowns: {
        byStatus:   ticketsByStatus.map((s) => ({ name: s.name, color: s.color, count: s._count.tickets })),
        byCategory: ticketsByCategory.map((c) => ({ name: c.name, color: c.color, count: c._count.tickets })),
        byPriority: ticketsByPriority.map((p) => ({ name: p.name, color: p.color, count: p._count.tickets })),
        techLoad:   techLoad.map((t) => ({ id: t.id, name: `${t.name} ${t.lastname}`, count: t._count.ticketsAssigned })),
      },
      trend: dailyTickets.map((d) => ({
        day: d.day.toISOString().slice(0, 10),
        count: Number(d.count),
      })),
      alerts: { contractsExpiring, assetsInMaintenance, credsExpiring },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    console.error("[REPORTES GET]", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
