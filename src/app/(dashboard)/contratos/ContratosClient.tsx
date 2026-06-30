"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Search, FileText, Users, CheckCircle2,
  AlertTriangle, XCircle, Clock, TrendingUp,
} from "lucide-react";

interface Customer { id: string; name: string; email?: string | null; taxId?: string | null; _count?: { contracts: number }; }
interface Contract {
  id: string; contractNumber: string; startDate: string; endDate: string;
  amount?: string | null; status: string; derivedStatus: string; notes?: string | null;
  customer: Customer;
}
interface Stats { total: number; active: number; expiring: number; expired: number; }

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  active:    { label: "Vigente",     color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  expiring:  { label: "Por vencer",  color: "text-amber-600   bg-amber-50   border-amber-200"   },
  expired:   { label: "Vencido",     color: "text-red-600     bg-red-50     border-red-200"      },
  cancelled: { label: "Cancelado",   color: "text-gray-500    bg-gray-50    border-gray-200"     },
  draft:     { label: "Borrador",    color: "text-blue-600    bg-blue-50    border-blue-200"     },
};

function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function ContratosClient() {
  const router = useRouter();
  const [tab,       setTab]       = useState<"contratos" | "clientes">("contratos");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats,     setStats]     = useState<Stats>({ total: 0, active: 0, expiring: 0, expired: 0 });
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("");

  const loadContracts = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set("q",      search);
    if (filter) p.set("status", filter);
    const res = await fetch(`/api/contratos?${p}`);
    if (res.ok) {
      const d = await res.json();
      setContracts(d.contracts ?? []);
      setStats(d.stats ?? { total: 0, active: 0, expiring: 0, expired: 0 });
    }
    setLoading(false);
  }, [search, filter]);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set("q", search);
    const res = await fetch(`/api/contratos/clientes?${p}`);
    if (res.ok) setCustomers((await res.json()).customers ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    if (tab === "contratos") loadContracts();
    else loadCustomers();
  }, [tab, loadContracts, loadCustomers]);

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Contratos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Clientes, contratos y renovaciones</p>
        </div>
        <Link href={tab === "contratos" ? "/contratos/nuevo" : "/contratos/nuevo?tipo=cliente"}
          className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors">
          <Plus size={15} />
          {tab === "contratos" ? "Nuevo Contrato" : "Nuevo Cliente"}
        </Link>
      </div>

      {/* Stats */}
      {tab === "contratos" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total",      value: stats.total,    icon: FileText,       color: "text-purple-500 bg-purple-50" },
            { label: "Vigentes",   value: stats.active,   icon: CheckCircle2,   color: "text-emerald-500 bg-emerald-50" },
            { label: "Por vencer", value: stats.expiring, icon: AlertTriangle,  color: "text-amber-500  bg-amber-50"  },
            { label: "Vencidos",   value: stats.expired,  icon: XCircle,        color: "text-red-500    bg-red-50"    },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                <s.icon size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-5 w-fit">
        {(["contratos", "clientes"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setSearch(""); setFilter(""); }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {t === "contratos" ? <><FileText size={14} /> Contratos</> : <><Users size={14} /> Clientes</>}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === "contratos" ? "Buscar por N° contrato o cliente..." : "Buscar cliente..."}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
          {tab === "contratos" && (
            <select value={filter} onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
              <option value="">Todos los estados</option>
              <option value="active">Vigentes</option>
              <option value="expiring">Por vencer (30d)</option>
              <option value="expired">Vencidos</option>
              <option value="cancelled">Cancelados</option>
              <option value="draft">Borradores</option>
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-sm text-gray-400">Cargando...</div>
      ) : tab === "contratos" ? (
        contracts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 flex flex-col items-center gap-3">
            <FileText size={32} className="text-purple-300" />
            <p className="text-gray-500 text-sm">No hay contratos registrados</p>
            <Link href="/contratos/nuevo" className="text-purple-600 text-sm font-medium hover:underline flex items-center gap-1">
              <Plus size={13} /> Crear el primero
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["N° Contrato", "Cliente", "Inicio", "Vencimiento", "Días restantes", "Monto", "Estado"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contracts.map((c) => {
                  const st   = STATUS_STYLE[c.derivedStatus] ?? STATUS_STYLE.active;
                  const days = daysUntil(c.endDate);
                  return (
                    <tr key={c.id} onClick={() => router.push(`/contratos/${c.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.contractNumber}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{c.customer.name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.startDate).toLocaleDateString("es-CL")}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.endDate).toLocaleDateString("es-CL")}</td>
                      <td className="px-4 py-3">
                        {c.derivedStatus !== "cancelled" && c.derivedStatus !== "draft" ? (
                          <span className={`flex items-center gap-1 text-xs font-medium ${
                            days < 0 ? "text-red-500" : days <= 30 ? "text-amber-600" : "text-gray-500"
                          }`}>
                            <Clock size={11} />
                            {days < 0 ? `Vencido (${Math.abs(days)}d)` : `${days}d`}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {c.amount ? `$${Number(c.amount).toLocaleString("es-CL")}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        customers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 flex flex-col items-center gap-3">
            <Users size={32} className="text-gray-300" />
            <p className="text-gray-500 text-sm">No hay clientes registrados</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Nombre", "RUT / Tax ID", "Email", "Teléfono", "Contratos"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.taxId ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{c.email ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{"—"}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-purple-600 font-medium">
                        <TrendingUp size={11} /> {c._count?.contracts ?? 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
