"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import {
  ArrowLeft, AlertTriangle, FileText, User, Calendar,
  Tag, Send, MessageSquare, Clock,
} from "lucide-react";

interface Comment {
  id: string; content: string; isInternal: boolean; createdAt: string;
  user: { id: string; name: string; lastname: string };
}
interface Ticket {
  id: string; ticketNumber: string; type: string; title: string;
  description: string; createdAt: string; updatedAt: string;
  requester:  { id: string; name: string; lastname: string; email: string } | null;
  assignee:   { id: string; name: string; lastname: string } | null;
  priority:   { id: string; name: string; color?: string | null } | null;
  status:     { id: string; name: string; color?: string | null } | null;
  category:   { id: string; name: string } | null;
  comments:   Comment[];
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [ticket, setTicket]   = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [comment, setComment]   = useState("");
  const [internal, setInternal] = useState(false);
  const [sending, setSending]   = useState(false);

  async function loadTicket() {
    const res = await fetch(`/api/tickets/${id}`);
    if (res.status === 404) { setNotFound(true); setLoading(false); return; }
    if (res.ok) setTicket((await res.json()).ticket);
    setLoading(false);
  }

  useEffect(() => { loadTicket(); }, [id]);

  async function sendComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSending(true);
    const res = await fetch(`/api/tickets/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: comment, isInternal: internal }),
    });
    if (res.ok) { setComment(""); loadTicket(); }
    setSending(false);
  }

  if (loading) return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Cargando ticket...</div>
    </div>
  );

  if (notFound) return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-sm">Ticket no encontrado</p>
        <Link href="/tickets" className="text-emerald-500 text-sm hover:underline">Volver a tickets</Link>
      </div>
    </div>
  );

  if (!ticket) return null;

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-6">

          {/* Back */}
          <Link href="/tickets"
            className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 mb-4">
            <ArrowLeft size={14} /> Volver a tickets
          </Link>

          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-sm text-gray-400">{ticket.ticketNumber}</span>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                ticket.type === "incidente" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
              }`}>
                {ticket.type === "incidente" ? <AlertTriangle size={10} /> : <FileText size={10} />}
                {ticket.type === "incidente" ? "Incidente" : "Requerimiento"}
              </span>
              {ticket.status && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium border"
                  style={{
                    borderColor: ticket.status.color ?? "#d1d5db",
                    color: ticket.status.color ?? "#6b7280",
                    backgroundColor: (ticket.status.color ?? "#6b7280") + "18",
                  }}>
                  {ticket.status.name}
                </span>
              )}
            </div>
            {ticket.priority && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0"
                style={{
                  backgroundColor: (ticket.priority.color ?? "#6b7280") + "22",
                  color: ticket.priority.color ?? "#6b7280",
                }}>
                {ticket.priority.name}
              </span>
            )}
          </div>

          <h1 className="text-xl font-bold text-gray-800 mb-5">{ticket.title}</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Main content */}
            <div className="lg:col-span-2 space-y-5">

              {/* Description */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Descripción</h2>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
              </div>

              {/* Comments */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <MessageSquare size={14} className="text-gray-400" />
                  Comentarios ({ticket.comments.length})
                </h2>

                {ticket.comments.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No hay comentarios aún</p>
                ) : (
                  <div className="space-y-4">
                    {ticket.comments.map((c) => (
                      <div key={c.id} className={`flex gap-3 ${c.isInternal ? "opacity-75" : ""}`}>
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-xs font-semibold text-gray-500">
                          {c.user.name[0]}{c.user.lastname[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-700">{c.user.name} {c.user.lastname}</span>
                            {c.isInternal && (
                              <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">Interno</span>
                            )}
                            <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString("es-CL")}</span>
                          </div>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add comment */}
                <form onSubmit={sendComment} className="mt-5 pt-4 border-t border-gray-100">
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                    placeholder="Escribe un comentario..." rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
                  <div className="flex items-center justify-between mt-2">
                    <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                      <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)}
                        className="w-3.5 h-3.5 accent-amber-500" />
                      Nota interna (no visible para el solicitante)
                    </label>
                    <button type="submit" disabled={sending || !comment.trim()}
                      className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white px-4 py-2 rounded-lg text-xs font-medium">
                      <Send size={12} /> {sending ? "Enviando..." : "Comentar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="text-sm font-semibold text-gray-700">Detalles</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <User size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Solicitante</p>
                      <p className="text-gray-700 font-medium">
                        {ticket.requester ? `${ticket.requester.name} ${ticket.requester.lastname}` : "—"}
                      </p>
                      {ticket.requester?.email && <p className="text-xs text-gray-400">{ticket.requester.email}</p>}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Asignado a</p>
                      <p className="text-gray-700 font-medium">
                        {ticket.assignee ? `${ticket.assignee.name} ${ticket.assignee.lastname}` : <span className="text-gray-400 font-normal">Sin asignar</span>}
                      </p>
                    </div>
                  </div>

                  {ticket.category && (
                    <div className="flex items-start gap-3">
                      <Tag size={14} className="text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Categoría</p>
                        <p className="text-gray-700 font-medium">{ticket.category.name}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Calendar size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Creado</p>
                      <p className="text-gray-700">{new Date(ticket.createdAt).toLocaleString("es-CL")}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Última actualización</p>
                      <p className="text-gray-700">{new Date(ticket.updatedAt).toLocaleString("es-CL")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
