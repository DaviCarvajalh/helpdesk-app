"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus, Search, Ticket, AlertCircle, Clock,
  CheckCircle2, XCircle, AlertTriangle, FileText,
} from "lucide-react";

interface TicketRow {
  id: string;
  ticketNumber: string;
  type: string;
  title: string;
  createdAt: string;
  requester: { name: string; lastname: string } | null;
  assignee:  { name: string; lastname: string } | null;
  priority:  { name: string; color?: string | null } | null;
  status:    { name: string; color?: string | null } | null;
  category:  { name: string } | null;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  Nuevo:            <AlertCircle  size={13} className="text-blue-500" />,
  Asignado:         <Clock        size={13} className="text-purple-500" />,
  "En Proceso":     <Clock        size={13} className="text-orange-500" />,
  "Pendiente Cliente": <Clock     size={13} className="text-yellow-500" />,
  Resuelto:         <CheckCircle2 size={13} className="text-emerald-500" />,
  Cerrado:          <XCircle      size={13} className="text-gray-400" />,
};

export default function TicketsClient() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [statusFilter,   setStatusFilter]   = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter)   params.set("status",   statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    const res = await fetch(`/api/tickets?${params}`);
    if (res.ok) setTickets((await res.json()).tickets);
    setLoading(false);
  }, [statusFilter, priorityFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = tickets.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.ticketNumber.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      `${t.requester?.name} ${t.requester?.lastname}`.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tickets</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de solicitudes e incidentes</p>
        </div>
        <Link href="/tickets/new"
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm">
          <Plus size={15} /> Nuevo Ticket
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tickets..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-400">
            <option value="">Todos los estados</option>
            <option>Nuevo</option>
            <option>Asignado</option>
            <option>En Proceso</option>
            <option>Pendiente Cliente</option>
            <option>Resuelto</option>
            <option>Cerrado</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-400">
            <option value="">Todas las prioridades</option>
            <option>Crítica</option>
            <option>Alta</option>
            <option>Media</option>
            <option>Baja</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {["#", "Tipo", "Título", "Estado", "Prioridad", "Asignado a", "Creado"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-16 text-center text-sm text-gray-400">Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center">
                      <Ticket size={26} className="text-orange-400" />
                    </div>
                    <p className="text-gray-500 text-sm">No hay tickets{search ? " que coincidan con la búsqueda" : " registrados"}</p>
                    {!search && (
                      <Link href="/tickets/new"
                        className="flex items-center gap-1.5 text-emerald-500 hover:text-emerald-600 text-sm font-medium">
                        <Plus size={14} /> Crear primer ticket
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ) : filtered.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">{t.ticketNumber}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                    t.type === "incidente" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {t.type === "incidente"
                      ? <AlertTriangle size={10} />
                      : <FileText size={10} />}
                    {t.type === "incidente" ? "Incidente" : "Requerimiento"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/tickets/${t.id}`} className="font-medium text-gray-800 hover:text-emerald-600 transition-colors line-clamp-1">
                    {t.title}
                  </Link>
                  {t.category && <p className="text-xs text-gray-400 mt-0.5">{t.category.name}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: t.status?.color ?? undefined }}>
                    {STATUS_ICON[t.status?.name ?? ""] ?? <AlertCircle size={13} />}
                    {t.status?.name ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {t.priority ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: (t.priority.color ?? "#6b7280") + "22",
                        color: t.priority.color ?? "#6b7280",
                      }}>
                      {t.priority.name}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {t.assignee ? `${t.assignee.name} ${t.assignee.lastname}` : <span className="text-gray-300">Sin asignar</span>}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(t.createdAt).toLocaleDateString("es-CL")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-50 text-xs text-gray-400">
            {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
            {search && ` (filtrado de ${tickets.length})`}
          </div>
        )}
      </div>
    </div>
  );
}
