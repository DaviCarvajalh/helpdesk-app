import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import {
  Plus,
  Inbox,
  Clock,
  UserX,
  CheckCircle2,
  TrendingUp,
  Users,
} from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };

const PRIORITY_COLOR: Record<string, string> = {
  Crítica: "bg-red-100 text-red-700",
  Alta: "bg-orange-100 text-orange-700",
  Media: "bg-yellow-100 text-yellow-700",
  Baja: "bg-green-100 text-green-700",
};

const STATUS_COLOR: Record<string, string> = {
  Nuevo: "bg-blue-100 text-blue-700",
  Asignado: "bg-purple-100 text-purple-700",
  "En Proceso": "bg-orange-100 text-orange-700",
  "Pendiente Cliente": "bg-yellow-100 text-yellow-700",
  Resuelto: "bg-emerald-100 text-emerald-700",
  Cerrado: "bg-gray-100 text-gray-600",
};

async function getStats() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());

  const [total, open, unassigned, resolvedToday, resolvedWeek, recentTickets, techLoad] =
    await Promise.all([
      prisma.hdTicket.count({ where: { deletedAt: null } }),
      prisma.hdTicket.count({ where: { deletedAt: null, status: { name: { in: ["Nuevo", "Asignado", "En Proceso", "Pendiente Cliente"] } } } }),
      prisma.hdTicket.count({ where: { deletedAt: null, assigneeId: null, status: { isClosed: false } } }),
      prisma.hdTicket.count({ where: { deletedAt: null, status: { name: "Resuelto" }, updatedAt: { gte: startOfDay } } }),
      prisma.hdTicket.count({ where: { deletedAt: null, status: { name: "Resuelto" }, updatedAt: { gte: startOfWeek } } }),
      prisma.hdTicket.findMany({
        take: 8,
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          priority: true,
          status: true,
          requester: { select: { name: true, lastname: true } },
        },
      }),
      prisma.secUser.findMany({
        where: { role: { name: { in: ["Técnico", "Supervisor"] } }, isActive: true, deletedAt: null },
        select: {
          id: true,
          name: true,
          lastname: true,
          _count: { select: { ticketsAssigned: { where: { deletedAt: null, status: { isClosed: false } } } } },
        },
        orderBy: { name: "asc" },
      }),
    ]);

  return { total, open, unassigned, resolvedToday, resolvedWeek, recentTickets, techLoad };
}

export default async function DashboardPage() {
  const { total, open, unassigned, resolvedToday, resolvedWeek, recentTickets, techLoad } =
    await getStats();

  const stats = [
    { label: "Total", value: total, icon: Inbox, iconColor: "text-blue-500", bg: "bg-blue-50" },
    { label: "Abiertos", value: open, icon: Clock, iconColor: "text-orange-500", bg: "bg-orange-50" },
    { label: "Sin Asignar", value: unassigned, icon: UserX, iconColor: "text-pink-500", bg: "bg-pink-50" },
    { label: "Resueltos Hoy", value: resolvedToday, icon: CheckCircle2, iconColor: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Esta Semana", value: resolvedWeek, icon: TrendingUp, iconColor: "text-purple-500", bg: "bg-purple-50" },
    { label: "Técnicos", value: techLoad.length, icon: Users, iconColor: "text-cyan-500", bg: "bg-cyan-50" },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header />

      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Resumen de tickets y actividad</p>
          </div>
          <a
            href="/tickets/new"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={15} />
            Nuevo Ticket
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
          {stats.map(({ label, value, icon: Icon, iconColor, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-2.5 shadow-sm">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={18} className={iconColor} />
              </div>
              <div className="text-2xl font-bold text-gray-800 leading-none">{value}</div>
              <div className="text-xs text-gray-400">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Tickets recientes */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Tickets Recientes</h2>
              <a href="/tickets" className="text-xs text-emerald-500 hover:text-emerald-600 font-medium transition-colors">
                Ver todos →
              </a>
            </div>
            {recentTickets.length === 0 ? (
              <div className="flex items-center justify-center h-28 text-sm text-gray-400">No hay tickets</div>
            ) : (
              <ul className="space-y-2">
                {recentTickets.map((t) => (
                  <li key={t.id}>
                    <a href={`/tickets/${t.id}`} className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-400">{t.ticketNumber}</p>
                        <p className="text-sm text-gray-700 truncate group-hover:text-emerald-600 transition-colors">{t.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {t.requester.name} {t.requester.lastname}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[t.status.name] ?? "bg-gray-100 text-gray-600"}`}>
                          {t.status.name}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLOR[t.priority.name] ?? "bg-gray-100 text-gray-600"}`}>
                          {t.priority.name}
                        </span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Carga por técnico */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Users size={15} className="text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-700">Carga por Técnico</h2>
            </div>
            {techLoad.length === 0 ? (
              <div className="flex items-center justify-center h-28 text-sm text-gray-400">No hay técnicos registrados</div>
            ) : (
              <ul className="space-y-2.5">
                {techLoad.map((tech) => {
                  const count = tech._count.ticketsAssigned;
                  const pct = Math.min(100, Math.round((count / Math.max(open, 1)) * 100));
                  return (
                    <li key={tech.id} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold shrink-0">
                        {tech.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700 truncate">{tech.name} {tech.lastname}</span>
                          <span className="text-xs text-gray-500 ml-2 shrink-0">{count} tickets</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
