import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import {
  Plus,
  Search,
  Filter,
  Ticket,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export const metadata: Metadata = { title: "Tickets" };

const PRIORITY_BADGE: Record<string, string> = {
  Crítica: "bg-red-100 text-red-700",
  Alta: "bg-orange-100 text-orange-700",
  Media: "bg-yellow-100 text-yellow-700",
  Baja: "bg-green-100 text-green-700",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  Nuevo: <AlertCircle size={14} className="text-blue-500" />,
  "En Proceso": <Clock size={14} className="text-orange-500" />,
  Resuelto: <CheckCircle2 size={14} className="text-emerald-500" />,
  Cerrado: <XCircle size={14} className="text-gray-400" />,
};

export default function TicketsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header />

      <div className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Tickets</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Gestión de solicitudes e incidentes
            </p>
          </div>
          <a
            href="/tickets/new"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={15} />
            Nuevo Ticket
          </a>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={15}
              />
              <input
                type="text"
                placeholder="Buscar tickets..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-400">
              <option value="">Todos los estados</option>
              <option>Nuevo</option>
              <option>Asignado</option>
              <option>En Proceso</option>
              <option>Pendiente Cliente</option>
              <option>Resuelto</option>
              <option>Cerrado</option>
            </select>
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-400">
              <option value="">Todas las prioridades</option>
              <option>Crítica</option>
              <option>Alta</option>
              <option>Media</option>
              <option>Baja</option>
            </select>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <Filter size={14} />
              Más filtros
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Título
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Asignado a
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Creado
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="px-4 py-16">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center">
                      <Ticket size={26} className="text-orange-400" />
                    </div>
                    <p className="text-gray-500 text-sm">
                      No hay tickets registrados
                    </p>
                    <a
                      href="/tickets/new"
                      className="flex items-center gap-1.5 text-emerald-500 hover:text-emerald-600 text-sm font-medium transition-colors"
                    >
                      <Plus size={14} />
                      Crear primer ticket
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
