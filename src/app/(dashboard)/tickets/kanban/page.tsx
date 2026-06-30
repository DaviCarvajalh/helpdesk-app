"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { Plus, AlertTriangle, FileText, ArrowLeft } from "lucide-react";

interface TicketCard {
  id: string; ticketNumber: string; type: string; title: string; createdAt: string;
  requester: { name: string; lastname: string } | null;
  assignee:  { name: string; lastname: string } | null;
  priority:  { name: string; color?: string | null } | null;
  status:    { id: string; name: string; color?: string | null } | null;
  category:  { name: string } | null;
}

interface Column {
  id: string; name: string; color: string | null;
  tickets: TicketCard[];
}

export default function KanbanPage() {
  const router = useRouter();
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [ticketsRes, optionsRes] = await Promise.all([
      fetch("/api/tickets"),
      fetch("/api/tickets/options"),
    ]);
    if (!ticketsRes.ok || !optionsRes.ok) { setLoading(false); return; }

    const { tickets }  = await ticketsRes.json();
    const { statuses } = await optionsRes.json();

    const cols: Column[] = statuses.map((s: { id: string; name: string; color?: string | null }) => ({
      id: s.id, name: s.name, color: s.color ?? null,
      tickets: (tickets as TicketCard[]).filter((t) => t.status?.id === s.id),
    }));

    setColumns(cols);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <Link href="/tickets"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft size={14} /> Lista
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-bold text-gray-800">Kanban</h1>
          </div>
          <Link href="/tickets/new"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm">
            <Plus size={14} /> Nuevo Ticket
          </Link>
        </div>

        {/* Board */}
        {loading ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            Cargando kanban...
          </div>
        ) : (
          <div className="flex gap-4 p-6 overflow-x-auto h-full items-start">
            {columns.map((col) => (
              <div key={col.id}
                className="flex-shrink-0 w-72 flex flex-col bg-gray-50 rounded-xl border border-gray-200 max-h-full overflow-hidden">

                {/* Column header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: col.color ?? "#9ca3af" }} />
                    <span className="text-sm font-semibold text-gray-700">{col.name}</span>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-200 rounded-full px-2 py-0.5">
                    {col.tickets.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {col.tickets.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">Sin tickets</p>
                  ) : col.tickets.map((t) => (
                    <div key={t.id}
                      onClick={() => router.push(`/tickets/${t.id}`)}
                      className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer">

                      {/* Type + number */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium ${
                          t.type === "incidente" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                        }`}>
                          {t.type === "incidente" ? <AlertTriangle size={9} /> : <FileText size={9} />}
                          {t.type === "incidente" ? "Inc" : "Req"}
                        </span>
                        <span className="text-xs font-mono text-gray-400">{t.ticketNumber}</span>
                      </div>

                      {/* Title */}
                      <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 leading-snug">
                        {t.title}
                      </p>

                      {/* Priority */}
                      {t.priority && (
                        <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-2"
                          style={{
                            backgroundColor: (t.priority.color ?? "#6b7280") + "22",
                            color: t.priority.color ?? "#6b7280",
                          }}>
                          {t.priority.name}
                        </span>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">
                          {t.assignee
                            ? `${t.assignee.name} ${t.assignee.lastname[0]}.`
                            : <span className="italic">Sin asignar</span>}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(t.createdAt).toLocaleDateString("es-CL")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
