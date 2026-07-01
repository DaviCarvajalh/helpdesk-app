import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/auth";
import Header from "@/components/layout/Header";
import Link from "next/link";
import {
  Plus, Inbox, Clock, UserX, CheckCircle2, TrendingUp, Users,
  AlertTriangle, FileText, Monitor, Shield, BookOpen, Wrench,
  XCircle, Package,
} from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };

const PRIORITY_COLOR: Record<string, string> = {
  Crítica: "bg-red-100 text-red-700",
  Alta:    "bg-orange-100 text-orange-700",
  Media:   "bg-yellow-100 text-yellow-700",
  Baja:    "bg-green-100 text-green-700",
};

const STATUS_COLOR: Record<string, string> = {
  Nuevo:              "bg-blue-100 text-blue-700",
  Asignado:           "bg-purple-100 text-purple-700",
  "En Proceso":       "bg-orange-100 text-orange-700",
  "Pendiente Cliente":"bg-yellow-100 text-yellow-700",
  Resuelto:           "bg-emerald-100 text-emerald-700",
  Cerrado:            "bg-gray-100 text-gray-600",
};

async function getStats() {
  const now         = new Date();
  const startOfDay  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const in7  = new Date(Date.now() +  7 * 24 * 60 * 60 * 1000);

  const [
    total, open, unassigned, resolvedToday, resolvedWeek, slaBreached,
    recentTickets, techLoad,
    // Cross-módulo
    assetsOk, assetsMaintenance, assetsTotal,
    contractsActive, contractsExpiring7,
    kbArticles,
    credsExpiring,
    contractsExpiring30,
  ] = await Promise.all([
    prisma.hdTicket.count({ where: { deletedAt: null } }),
    prisma.hdTicket.count({ where: { deletedAt: null, status: { isClosed: false } } }),
    prisma.hdTicket.count({ where: { deletedAt: null, assigneeId: null, status: { isClosed: false } } }),
    prisma.hdTicket.count({ where: { deletedAt: null, status: { name: "Resuelto" }, updatedAt: { gte: startOfDay } } }),
    prisma.hdTicket.count({ where: { deletedAt: null, status: { name: "Resuelto" }, updatedAt: { gte: startOfWeek } } }),
    prisma.hdTicket.count({ where: { deletedAt: null, status: { isClosed: false }, slaDeadline: { lt: now } } }),

    prisma.hdTicket.findMany({
      take: 7,
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        priority: true, status: true,
        requester: { select: { name: true, lastname: true } },
      },
    }),

    prisma.secUser.findMany({
      where: { role: { name: { in: [ROLES.TECNICO, ROLES.SUPERVISOR] } }, isActive: true, deletedAt: null },
      select: {
        id: true, name: true, lastname: true,
        _count: { select: { ticketsAssigned: { where: { deletedAt: null, status: { isClosed: false } } } } },
      },
      orderBy: { name: "asc" },
    }),

    // Activos
    prisma.invAsset.count({ where: { deletedAt: null, status: "active" } }),
    prisma.invAsset.count({ where: { deletedAt: null, status: "maintenance" } }),
    prisma.invAsset.count({ where: { deletedAt: null } }),

    // Contratos (solo los que no han vencido aún)
    prisma.hdContract.count({ where: { deletedAt: null, status: "active", endDate: { gte: now } } }),
    prisma.hdContract.count({ where: { deletedAt: null, status: "active", endDate: { gt: now, lt: in7 } } }),

    // KB
    prisma.kbArticle.count({ where: { deletedAt: null, published: true } }),

    // Credenciales por vencer en 7 días
    prisma.secCredential.count({ where: { deletedAt: null, expiresAt: { gt: now, lt: in7 } } }),

    // Contratos por vencer en 30 días (para lista)
    prisma.hdContract.findMany({
      where: { deletedAt: null, status: { not: "cancelled" }, endDate: { gt: now, lt: in30 } },
      select: { id: true, contractNumber: true, endDate: true, customer: { select: { name: true } } },
      orderBy: { endDate: "asc" },
      take: 4,
    }),
  ]);

  return {
    total, open, unassigned, resolvedToday, resolvedWeek, slaBreached,
    recentTickets, techLoad,
    assetsOk, assetsMaintenance, assetsTotal,
    contractsActive, contractsExpiring7,
    kbArticles, credsExpiring,
    contractsExpiring30,
  };
}

export default async function DashboardPage() {
  const d = await getStats();

  const ticketKpis = [
    { label: "Tickets abiertos",  value: d.open,           icon: Clock,        iconColor: "text-orange-500", bg: "bg-orange-50",  href: "/tickets" },
    { label: "Sin asignar",       value: d.unassigned,     icon: UserX,        iconColor: "text-pink-500",   bg: "bg-pink-50",    href: "/tickets" },
    { label: "SLA vencido",       value: d.slaBreached,    icon: XCircle,      iconColor: "text-red-500",    bg: "bg-red-50",     href: "/reportes" },
    { label: "Resueltos hoy",     value: d.resolvedToday,  icon: CheckCircle2, iconColor: "text-emerald-500",bg: "bg-emerald-50", href: "/tickets" },
    { label: "Esta semana",       value: d.resolvedWeek,   icon: TrendingUp,   iconColor: "text-purple-500", bg: "bg-purple-50",  href: "/reportes" },
    { label: "Total tickets",     value: d.total,          icon: Inbox,        iconColor: "text-blue-500",   bg: "bg-blue-50",    href: "/tickets" },
  ];

  const systemKpis = [
    { label: "Activos operativos", value: d.assetsOk,         icon: Package,   iconColor: "text-cyan-500",   bg: "bg-cyan-50",   href: "/inventario" },
    { label: "En mantención",      value: d.assetsMaintenance, icon: Wrench,   iconColor: "text-amber-500",  bg: "bg-amber-50",  href: "/inventario" },
    { label: "Contratos activos",  value: d.contractsActive,  icon: FileText,  iconColor: "text-indigo-500", bg: "bg-indigo-50", href: "/contratos" },
    { label: "Artículos KB",       value: d.kbArticles,       icon: BookOpen,  iconColor: "text-teal-500",   bg: "bg-teal-50",   href: "/conocimiento" },
  ];

  const hasAlerts = d.slaBreached > 0 || d.contractsExpiring7 > 0 || d.credsExpiring > 0 || d.assetsMaintenance > 0;

  return (
    <div className="flex flex-col h-full">
      <Header />

      <div className="flex-1 p-6 overflow-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Vista ejecutiva del sistema</p>
          </div>
          <Link href="/tickets/new"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors">
            <Plus size={15} /> Nuevo Ticket
          </Link>
        </div>

        {/* Alertas urgentes */}
        {hasAlerts && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
            {d.slaBreached > 0 && (
              <Link href="/reportes" className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 hover:bg-red-100 transition-colors">
                <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                  <XCircle size={18} className="text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-700">{d.slaBreached} SLA vencido{d.slaBreached > 1 ? "s" : ""}</p>
                  <p className="text-xs text-red-500">Tickets fuera de tiempo</p>
                </div>
              </Link>
            )}
            {d.contractsExpiring7 > 0 && (
              <Link href="/contratos" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 hover:bg-amber-100 transition-colors">
                <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-700">{d.contractsExpiring7} contrato{d.contractsExpiring7 > 1 ? "s" : ""}</p>
                  <p className="text-xs text-amber-500">Vence en 7 días</p>
                </div>
              </Link>
            )}
            {d.credsExpiring > 0 && (
              <Link href="/credenciales" className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4 hover:bg-orange-100 transition-colors">
                <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                  <Shield size={18} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-orange-700">{d.credsExpiring} credencial{d.credsExpiring > 1 ? "es" : ""}</p>
                  <p className="text-xs text-orange-500">Vence en 7 días</p>
                </div>
              </Link>
            )}
            {d.assetsMaintenance > 0 && (
              <Link href="/inventario" className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 hover:bg-yellow-100 transition-colors">
                <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
                  <Monitor size={18} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-yellow-700">{d.assetsMaintenance} equipo{d.assetsMaintenance > 1 ? "s" : ""}</p>
                  <p className="text-xs text-yellow-600">En mantención</p>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* KPIs Tickets */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tickets</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
          {ticketKpis.map(({ label, value, icon: Icon, iconColor, bg, href }) => (
            <Link key={label} href={href}
              className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-2.5 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={18} className={iconColor} />
              </div>
              <div className="text-2xl font-bold text-gray-800 leading-none">{value}</div>
              <div className="text-xs text-gray-400">{label}</div>
            </Link>
          ))}
        </div>

        {/* KPIs Sistema */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sistema</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {systemKpis.map(({ label, value, icon: Icon, iconColor, bg, href }) => (
            <Link key={label} href={href}
              className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-2.5 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={18} className={iconColor} />
              </div>
              <div className="text-2xl font-bold text-gray-800 leading-none">{value}</div>
              <div className="text-xs text-gray-400">{label}</div>
            </Link>
          ))}
        </div>

        {/* Fila principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Tickets recientes */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Tickets Recientes</h2>
              <Link href="/tickets" className="text-xs text-emerald-500 hover:text-emerald-600 font-medium">Ver todos →</Link>
            </div>
            {d.recentTickets.length === 0 ? (
              <div className="flex items-center justify-center h-28 text-sm text-gray-400">No hay tickets</div>
            ) : (
              <ul className="space-y-1">
                {d.recentTickets.map((t) => (
                  <li key={t.id}>
                    <Link href={`/tickets/${t.id}`}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-400">{t.ticketNumber}</p>
                        <p className="text-sm text-gray-700 truncate group-hover:text-emerald-600 transition-colors">{t.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{t.requester.name} {t.requester.lastname}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[t.status.name] ?? "bg-gray-100 text-gray-600"}`}>
                          {t.status.name}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLOR[t.priority.name] ?? "bg-gray-100 text-gray-600"}`}>
                          {t.priority.name}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Panel derecho */}
          <div className="space-y-4">

            {/* Carga por técnico */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Users size={14} className="text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-700">Carga Técnicos</h2>
              </div>
              {d.techLoad.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">Sin técnicos</p>
              ) : (
                <ul className="space-y-3">
                  {d.techLoad.sort((a, b) => b._count.ticketsAssigned - a._count.ticketsAssigned).map((tech) => {
                    const count = tech._count.ticketsAssigned;
                    const max   = Math.max(...d.techLoad.map(t => t._count.ticketsAssigned), 1);
                    const pct   = Math.min(100, Math.round((count / max) * 100));
                    return (
                      <li key={tech.id} className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px] font-bold shrink-0">
                          {tech.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-gray-600 truncate">{tech.name}</span>
                            <span className="text-xs text-gray-500 ml-1 shrink-0">{count}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Contratos por vencer */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-700">Contratos por vencer</h2>
                </div>
                <Link href="/contratos" className="text-xs text-emerald-500 hover:underline">Ver →</Link>
              </div>
              {(d.contractsExpiring30 as { id: string; contractNumber: string; endDate: Date; customer: { name: string } }[]).length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">Sin contratos por vencer</p>
              ) : (
                <ul className="space-y-2">
                  {(d.contractsExpiring30 as { id: string; contractNumber: string; endDate: Date; customer: { name: string } }[]).map((c) => {
                    const days = Math.ceil((new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <li key={c.id}>
                        <Link href={`/contratos/${c.id}`}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-600">{c.contractNumber}</p>
                            <p className="text-xs text-gray-400 truncate">{c.customer.name}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            days <= 7 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                          }`}>
                            {days}d
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

          </div>
        </div>

        {/* Stats sistema en pie */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center">
              <Monitor size={18} className="text-cyan-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Inventario</p>
              <p className="text-sm font-bold text-gray-800">{d.assetsOk} operativos · {d.assetsMaintenance} en mantención · {d.assetsTotal} total</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
              <FileText size={18} className="text-indigo-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Contratos</p>
              <p className="text-sm font-bold text-gray-800">{d.contractsActive} activos · {(d.contractsExpiring30 as unknown[]).length} por vencer</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
              <BookOpen size={18} className="text-teal-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Base de Conocimiento</p>
              <p className="text-sm font-bold text-gray-800">{d.kbArticles} artículo{d.kbArticles !== 1 ? "s" : ""} publicado{d.kbArticles !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
