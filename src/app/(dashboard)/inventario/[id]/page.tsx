"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import {
  ArrowLeft, Monitor, CheckCircle2, Wrench, Archive, HardDrive,
  User, MapPin, Tag, Calendar, ShieldCheck, FileText, Pencil, Trash2, ChevronDown,
} from "lucide-react";

interface Asset {
  id: string; assetCode: string; name: string; brand?: string | null;
  model?: string | null; serialNumber?: string | null; categoryId?: string | null;
  status: string; location?: string | null; notes?: string | null;
  purchaseDate?: string | null; warrantyEnd?: string | null;
  createdAt: string; updatedAt: string;
  assignee?: { id: string; name: string; lastname: string; email: string } | null;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active:      { label: "Activo",     color: "#059669", bg: "#d1fae5" },
  maintenance: { label: "Mantención", color: "#d97706", bg: "#fef3c7" },
  retired:     { label: "Retirado",   color: "#dc2626", bg: "#fee2e2" },
  storage:     { label: "Bodega",     color: "#6b7280", bg: "#f3f4f6" },
};

export default function InventarioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [asset,    setAsset]    = useState<Asset | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing,  setEditing]  = useState(false);

  // Edit state
  const [editStatus,   setEditStatus]   = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editNotes,    setEditNotes]    = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/inventario/${id}`);
    if (res.status === 404) { setNotFound(true); setLoading(false); return; }
    if (res.ok) {
      const { asset: a } = await res.json();
      setAsset(a);
      setEditStatus(a.status);
      setEditLocation(a.location ?? "");
      setEditNotes(a.notes ?? "");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function saveEdit() {
    if (!asset) return;
    setSaving(true);
    await fetch(`/api/inventario/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status:   editStatus,
        location: editLocation || undefined,
        notes:    editNotes    || undefined,
      }),
    });
    setEditing(false);
    setSaving(false);
    load();
  }

  async function deleteAsset() {
    if (!confirm("¿Eliminar este activo del inventario?")) return;
    await fetch(`/api/inventario/${id}`, { method: "DELETE" });
    router.push("/inventario");
  }

  if (loading) return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Cargando...</div>
    </div>
  );

  if (notFound || !asset) return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <Monitor size={32} className="text-gray-300" />
        <p className="text-gray-500">Activo no encontrado</p>
        <Link href="/inventario" className="text-emerald-600 text-sm hover:underline">Volver</Link>
      </div>
    </div>
  );

  const st      = STATUS_MAP[asset.status] ?? STATUS_MAP.active;
  const warranty = asset.warrantyEnd ? new Date(asset.warrantyEnd) : null;
  const warrantyExpired = warranty && warranty < new Date();

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-6">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <Link href="/inventario"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft size={14} /> Inventario
            </Link>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(!editing)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
                <Pencil size={12} /> {editing ? "Cancelar" : "Editar"}
              </button>
              <button onClick={deleteAsset}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-500 hover:bg-red-50">
                <Trash2 size={12} /> Eliminar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {/* Main card */}
            <div className="col-span-2 space-y-5">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                    <Monitor size={26} className="text-sky-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                        {asset.assetCode}
                      </span>
                      {asset.categoryId && (
                        <span className="text-xs text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full font-medium">
                          {asset.categoryId}
                        </span>
                      )}
                    </div>
                    <h1 className="text-xl font-bold text-gray-800">{asset.name}</h1>
                    {(asset.brand || asset.model) && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {[asset.brand, asset.model].filter(Boolean).join(" — ")}
                      </p>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full font-medium"
                    style={{ color: st.color, backgroundColor: st.bg }}>
                    {asset.status === "active"      && <CheckCircle2 size={13} />}
                    {asset.status === "maintenance" && <Wrench       size={13} />}
                    {asset.status === "retired"     && <Archive      size={13} />}
                    {asset.status === "storage"     && <HardDrive    size={13} />}
                    {st.label}
                  </span>
                </div>

                {asset.notes && (
                  <p className="mt-4 text-sm text-gray-500 bg-gray-50 rounded-lg p-3 leading-relaxed">
                    {asset.notes}
                  </p>
                )}
              </div>

              {/* Edit panel */}
              {editing && (
                <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-5 space-y-4">
                  <h2 className="text-sm font-semibold text-gray-700">Editar activo</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Estado</label>
                      <div className="relative">
                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                          className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-400">
                          <option value="active">Activo</option>
                          <option value="maintenance">En mantención</option>
                          <option value="storage">En bodega</option>
                          <option value="retired">Retirado</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Ubicación</label>
                      <input value={editLocation} onChange={(e) => setEditLocation(e.target.value)}
                        placeholder="Sala servidores..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Notas</label>
                    <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
                  </div>
                  <div className="flex justify-end">
                    <button onClick={saveEdit} disabled={saving}
                      className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white text-sm font-medium rounded-lg">
                      {saving ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4 text-sm">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Detalles</h2>

                {asset.serialNumber && (
                  <div className="flex items-start gap-2.5">
                    <Tag size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">N° de serie</p>
                      <p className="font-mono text-gray-700 text-xs mt-0.5">{asset.serialNumber}</p>
                    </div>
                  </div>
                )}

                {asset.location && (
                  <div className="flex items-start gap-2.5">
                    <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Ubicación</p>
                      <p className="text-gray-700">{asset.location}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5">
                  <User size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Asignado a</p>
                    <p className="text-gray-700">
                      {asset.assignee
                        ? `${asset.assignee.name} ${asset.assignee.lastname}`
                        : <span className="text-gray-400 italic">Sin asignar</span>}
                    </p>
                  </div>
                </div>

                {asset.purchaseDate && (
                  <div className="flex items-start gap-2.5">
                    <Calendar size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Fecha de compra</p>
                      <p className="text-gray-700">{new Date(asset.purchaseDate).toLocaleDateString("es-CL")}</p>
                    </div>
                  </div>
                )}

                {warranty && (
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck size={14} className={`mt-0.5 shrink-0 ${warrantyExpired ? "text-red-400" : "text-emerald-500"}`} />
                    <div>
                      <p className="text-xs text-gray-400">Garantía</p>
                      <p className={`font-medium ${warrantyExpired ? "text-red-600" : "text-gray-700"}`}>
                        {warranty.toLocaleDateString("es-CL")}
                      </p>
                      {warrantyExpired && (
                        <p className="text-xs text-red-500 mt-0.5">Expirada</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5">
                  <FileText size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Registrado</p>
                    <p className="text-gray-700">{new Date(asset.createdAt).toLocaleDateString("es-CL")}</p>
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
