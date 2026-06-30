"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Search, ClipboardList, AlertTriangle, BookOpen, Globe, Lock,
} from "lucide-react";

interface Step { id: string; order: number; title: string; }
interface Procedure {
  id: string; title: string; description?: string | null;
  category?: string | null; isPublished: boolean;
  createdAt: string; updatedAt: string;
  steps: Step[];
}

const CATEGORIES = [
  "Redes", "VMware", "SQL Server", "Oracle",
  "Power BI", "Office 365", "Linux", "General",
];

export default function ProcedimientosClient() {
  const router = useRouter();
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [category, setCategory]     = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)   params.set("q",        search);
    if (category) params.set("category", category);
    const res = await fetch(`/api/procedimientos?${params}`);
    if (res.ok) setProcedures((await res.json()).procedures);
    setLoading(false);
  }, [search, category]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Procedimientos</h1>
          <p className="text-sm text-gray-500 mt-0.5">SOPs y guías operativas internas</p>
        </div>
        <Link href="/procedimientos/nuevo"
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors">
          <Plus size={15} /> Nuevo Procedimiento
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar procedimientos..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
            <option value="">Todas las categorías</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-sm text-gray-400">Cargando...</div>
      ) : procedures.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 flex flex-col items-center gap-3">
          <ClipboardList size={32} className="text-blue-300" />
          <p className="text-gray-500 text-sm">No hay procedimientos registrados</p>
          <Link href="/procedimientos/nuevo"
            className="text-emerald-600 text-sm font-medium hover:underline flex items-center gap-1">
            <Plus size={13} /> Crear el primero
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {procedures.map((p) => (
            <div key={p.id}
              onClick={() => router.push(`/procedimientos/${p.id}`)}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer flex flex-col gap-3">

              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <ClipboardList size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 line-clamp-1">{p.title}</h3>
                    {p.category && (
                      <span className="text-xs text-gray-400">{p.category}</span>
                    )}
                  </div>
                </div>
                {p.isPublished
                  ? <Globe size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                  : <Lock size={13} className="text-gray-400 shrink-0 mt-0.5" />}
              </div>

              {/* Description */}
              {p.description && (
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{p.description}</p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <BookOpen size={11} />
                  {p.steps.length} {p.steps.length === 1 ? "paso" : "pasos"}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(p.updatedAt).toLocaleDateString("es-CL")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
