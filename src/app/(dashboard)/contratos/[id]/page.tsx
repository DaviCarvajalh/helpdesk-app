"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import {
  ArrowLeft, FileText, Building2, Calendar, DollarSign,
  Clock, CheckCircle2, XCircle, AlertTriangle, Pencil, Trash2, ChevronDown,
} from "lucide-react";

interface Contract {
  id: string; contractNumber: string; startDate: string; endDate: string;
  amount?: string | null; status: string; notes?: string | null;
  createdAt: string; updatedAt: string;
  customer: { id: string; name: string; email?: string | null; phone?: string | null; taxId?: string | null; };
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: "Vigente",     color: "#059669", bg: "#d1fae5" },
  expiring:  { label: "Por vencer",  color: "#d97706", bg: "#fef3c7" },
  expired:   { label: "Vencido",     color: "#dc2626", bg: "#fee2e2" },
  cancelled: { label: "Cancelado",   color: "#6b7280", bg: "#f3f4f6" },
  draft:     { label: "Borrador",    color: "#2563eb", bg: "#eff6ff" },
};

function getDerived(contract: Contract): string {
  if (contract.status === "cancelled" || contract.status === "draft") return contract.status;
  const now  = new Date();
  const end  = new Date(contract.endDate);
  const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (end < now)  return "expired";
  if (days <= 30) return "expiring";
  return "active";
}

export default function ContratoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing,  setEditing]  = useState(false);

  const [editStatus, setEditStatus] = useState("");
  const [editEnd,    setEditEnd]    = useState("");
  const [editNotes,  setEditNotes]  = useState("");
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/contratos/${id}`);
    if (res.status === 404) { setNotFound(true); setLoading(false); return; }
    if (res.ok) {
      const { contract: c } = await res.json();
      setContract(c);
      setEditStatus(c.status);
      setEditEnd(c.endDate.slice(0, 10));
      setEditNotes(c.notes ?? "");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function saveEdit() {
    setSaving(true);
    await fetch(`/api/contratos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status:  editStatus,
        endDate: editEnd,
        notes:   editNotes || undefined,
      }),
    });
    setEditing(false); setSaving(false);
    load();
  }

  async function deleteContract() {
    if (!confirm("¿Eliminar este contrato?")) return;
    await fetch(`/api/contratos/${id}`, { method: "DELETE" });
    router.push("/contratos");
  }

  if (loading) return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Cargando...</div>
    </div>
  );

  if (notFound || !contract) return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <FileText size={32} className="text-gray-300" />
        <p className="text-gray-500">Contrato no encontrado</p>
        <Link href="/contratos" className="text-purple-600 text-sm hover:underline">Volver</Link>
      </div>
    </div>
  );

  const derived = getDerived(contract);
  const st      = STATUS_STYLE[derived] ?? STATUS_STYLE.active;
  const daysLeft = Math.ceil((new Date(contract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-6">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <Link href="/contratos"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft size={14} /> Contratos
            </Link>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(!editing)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
                <Pencil size={12} /> {editing ? "Cancelar" : "Editar"}
              </button>
              <button onClick={deleteContract}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-500 hover:bg-red-50">
                <Trash2 size={12} /> Eliminar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {/* Main */}
            <div className="col-span-2 space-y-5">

              {/* Header card */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                    <FileText size={22} className="text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                        {contract.contractNumber}
                      </span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-800">{contract.customer.name}</h1>
                    {contract.customer.taxId && (
                      <p className="text-sm text-gray-400 mt-0.5">RUT {contract.customer.taxId}</p>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full font-medium"
                    style={{ color: st.color, backgroundColor: st.bg }}>
                    {derived === "active"   && <CheckCircle2 size={13} />}
                    {derived === "expiring" && <AlertTriangle size={13} />}
                    {derived === "expired"  && <XCircle size={13} />}
                    {derived === "cancelled"&& <XCircle size={13} />}
                    {st.label}
                  </span>
                </div>

                {/* Days banner */}
                {(derived === "expiring" || derived === "active") && (
                  <div className={`mt-4 flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg ${
                    derived === "expiring" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                  }`}>
                    <Clock size={14} />
                    {daysLeft > 0 ? `Vence en ${daysLeft} días (${new Date(contract.endDate).toLocaleDateString("es-CL")})` : "Venció hoy"}
                  </div>
                )}
                {derived === "expired" && (
                  <div className="mt-4 flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg bg-red-50 text-red-700">
                    <XCircle size={14} />
                    Venció hace {Math.abs(daysLeft)} días — requiere renovación
                  </div>
                )}

                {contract.notes && (
                  <p className="mt-4 text-sm text-gray-500 bg-gray-50 rounded-lg p-3 leading-relaxed">
                    {contract.notes}
                  </p>
                )}
              </div>

              {/* Edit panel */}
              {editing && (
                <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-5 space-y-4">
                  <h2 className="text-sm font-semibold text-gray-700">Editar contrato</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Estado</label>
                      <div className="relative">
                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                          className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-purple-400">
                          <option value="active">Activo</option>
                          <option value="draft">Borrador</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Nueva fecha de vencimiento</label>
                      <input type="date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Notas</label>
                    <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
                  </div>
                  <div className="flex justify-end">
                    <button onClick={saveEdit} disabled={saving}
                      className="px-5 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white text-sm font-medium rounded-lg">
                      {saving ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Cliente */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={12} /> Cliente
                </h2>
                <p className="font-semibold text-gray-800">{contract.customer.name}</p>
                {contract.customer.email && (
                  <p className="text-xs text-gray-500">{contract.customer.email}</p>
                )}
                {contract.customer.phone && (
                  <p className="text-xs text-gray-500">{contract.customer.phone}</p>
                )}
              </div>

              {/* Detalles */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4 text-sm">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Detalles</h2>
                <div className="flex items-start gap-2.5">
                  <Calendar size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Período</p>
                    <p className="text-gray-700">
                      {new Date(contract.startDate).toLocaleDateString("es-CL")} →{" "}
                      {new Date(contract.endDate).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                </div>
                {contract.amount && (
                  <div className="flex items-start gap-2.5">
                    <DollarSign size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Monto</p>
                      <p className="text-gray-700 font-semibold">
                        ${Number(contract.amount).toLocaleString("es-CL")}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2.5">
                  <Clock size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Registrado</p>
                    <p className="text-gray-700">{new Date(contract.createdAt).toLocaleDateString("es-CL")}</p>
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
