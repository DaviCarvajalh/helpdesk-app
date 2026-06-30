"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Search, Monitor, Server, Cpu, HardDrive,
  CheckCircle2, AlertTriangle, Archive, Wrench,
} from "lucide-react";

const ASSET_CATEGORIES = ["PC", "Notebook", "Servidor", "Switch", "Router", "Impresora", "Monitor", "UPS", "Teléfono", "Otro"];

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active:      { label: "Activo",       color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  maintenance: { label: "Mantención",   color: "text-amber-600  bg-amber-50  border-amber-200",    icon: Wrench       },
  retired:     { label: "Retirado",     color: "text-red-600    bg-red-50    border-red-200",       icon: Archive      },
  storage:     { label: "Bodega",       color: "text-gray-600   bg-gray-50   border-gray-200",      icon: HardDrive    },
};

interface Asset {
  id: string; assetCode: string; name: string; brand?: string | null;
  model?: string | null; categoryId?: string | null; status: string;
  location?: string | null; assignedTo?: string | null; serialNumber?: string | null;
  purchaseDate?: string | null; warrantyEnd?: string | null; createdAt: string;
  assignee?: { id: string; name: string; lastname: string } | null;
}

interface InfraAsset {
  id: string; hostname: string; ipAddress?: string | null;
  operatingSystem?: string | null; environment?: string | null;
  criticality?: string | null; createdAt: string;
}

interface Stats { total: number; active: number; maintenance: number; retired: number; }

const CRIT_COLOR: Record<string, string> = {
  critical: "text-red-600 bg-red-50 border-red-200",
  high:     "text-orange-600 bg-orange-50 border-orange-200",
  medium:   "text-yellow-600 bg-yellow-50 border-yellow-200",
  low:      "text-gray-500 bg-gray-50 border-gray-200",
};

export default function InventarioClient() {
  const router = useRouter();
  const [tab,    setTab]    = useState<"equipos" | "infra">("equipos");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [infra,  setInfra]  = useState<InfraAsset[]>([]);
  const [stats,  setStats]  = useState<Stats>({ total: 0, active: 0, maintenance: 0, retired: 0 });
  const [loading, setLoading] = useState(true);
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("");
  const [category, setCategory] = useState("");

  const loadAssets = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search)   p.set("q",        search);
    if (status)   p.set("status",   status);
    if (category) p.set("category", category);
    const res = await fetch(`/api/inventario?${p}`);
    if (res.ok) {
      const d = await res.json();
      setAssets(d.assets ?? []);
      setStats(d.stats  ?? { total: 0, active: 0, maintenance: 0, retired: 0 });
    }
    setLoading(false);
  }, [search, status, category]);

  const loadInfra = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set("q", search);
    const res = await fetch(`/api/inventario/infra?${p}`);
    if (res.ok) setInfra((await res.json()).assets ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    if (tab === "equipos") loadAssets();
    else loadInfra();
  }, [tab, loadAssets, loadInfra]);

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventario TI</h1>
          <p className="text-sm text-gray-500 mt-0.5">Equipos y activos de tecnología</p>
        </div>
        <Link href="/inventario/nuevo"
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors">
          <Plus size={15} />
          {tab === "equipos" ? "Nuevo Equipo" : "Nuevo Servidor"}
        </Link>
      </div>

      {/* Stats (solo equipos) */}
      {tab === "equipos" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total",       value: stats.total,       icon: Monitor,      color: "text-sky-500   bg-sky-50"     },
            { label: "Activos",     value: stats.active,      icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50" },
            { label: "Mantención",  value: stats.maintenance, icon: Wrench,       color: "text-amber-500  bg-amber-50"   },
            { label: "Retirados",   value: stats.retired,     icon: Archive,      color: "text-red-500    bg-red-50"     },
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
        {(["equipos", "infra"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {t === "equipos" ? <><Monitor size={14} /> Equipos</> : <><Server size={14} /> Infraestructura</>}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === "equipos" ? "Buscar por nombre, código, marca, S/N..." : "Buscar por hostname o IP..."}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>

          {tab === "equipos" && (
            <>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                <option value="">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="maintenance">Mantención</option>
                <option value="retired">Retirado</option>
                <option value="storage">Bodega</option>
              </select>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                <option value="">Todas las categorías</option>
                {ASSET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-sm text-gray-400">Cargando...</div>
      ) : tab === "equipos" ? (
        assets.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 flex flex-col items-center gap-3">
            <Monitor size={32} className="text-sky-300" />
            <p className="text-gray-500 text-sm">No hay equipos registrados</p>
            <Link href="/inventario/nuevo" className="text-emerald-600 text-sm font-medium hover:underline flex items-center gap-1">
              <Plus size={13} /> Registrar el primero
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Código", "Nombre", "Categoría", "Marca / Modelo", "Estado", "Asignado a", "Ubicación"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assets.map((a) => {
                  const st = STATUS_MAP[a.status] ?? STATUS_MAP.active;
                  const Icon = st.icon;
                  return (
                    <tr key={a.id} onClick={() => router.push(`/inventario/${a.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.assetCode}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{a.name}</td>
                      <td className="px-4 py-3 text-gray-500">{a.categoryId ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {[a.brand, a.model].filter(Boolean).join(" / ") || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border font-medium ${st.color}`}>
                          <Icon size={10} /> {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {a.assignee ? `${a.assignee.name} ${a.assignee.lastname}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{a.location ?? <span className="text-gray-300">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        infra.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 flex flex-col items-center gap-3">
            <Server size={32} className="text-gray-300" />
            <p className="text-gray-500 text-sm">No hay activos de infraestructura registrados</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Hostname", "IP", "OS", "Entorno", "Criticidad"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {infra.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2">
                      <Cpu size={13} className="text-gray-400" /> {a.hostname}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.ipAddress ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{a.operatingSystem ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{a.environment ?? "—"}</td>
                    <td className="px-4 py-3">
                      {a.criticality ? (
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${CRIT_COLOR[a.criticality] ?? ""}`}>
                          {a.criticality}
                        </span>
                      ) : "—"}
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
