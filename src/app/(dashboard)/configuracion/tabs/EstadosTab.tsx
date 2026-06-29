"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface Status { id: string; name: string; color?: string | null; isClosed: boolean; }

const EMPTY_FORM = { name: "", color: "#6b7280", isClosed: false };

export default function EstadosTab() {
  const [items, setItems]         = useState<Status[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Status | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [deleting, setDeleting]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/statuses");
    if (res.ok) setItems((await res.json()).statuses);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setFormError(""); setShowModal(true); }
  function openEdit(s: Status) {
    setEditing(s);
    setForm({ name: s.name, color: s.color ?? "#6b7280", isClosed: s.isClosed });
    setFormError(""); setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setFormError(""); setSaving(true);
    try {
      const res = await fetch(
        editing ? `/api/admin/statuses/${editing.id}` : "/api/admin/statuses",
        { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }
      );
      const data = await res.json();
      if (!res.ok) { setFormError(data.message ?? "Error"); return; }
      setShowModal(false); load();
    } catch { setFormError("Error de conexión"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteId) return; setDeleting(true);
    const res = await fetch(`/api/admin/statuses/${deleteId}`, { method: "DELETE" });
    if (res.ok) { setDeleteId(null); load(); }
    else { const d = await res.json(); alert(d.message ?? "Error"); }
    setDeleting(false);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{items.length} estados</p>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm">
          <Plus size={14} /> Nuevo Estado
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border p-10 text-center text-sm text-gray-400">Cargando...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Nombre", "Color", "¿Cierra ticket?", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-400">No hay estados</td></tr>
              ) : items.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: (s.color ?? "#6b7280") + "22", color: s.color ?? "#6b7280" }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color ?? "#6b7280" }} />
                      {s.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: s.color ?? "#6b7280" }} />
                      <span className="text-xs text-gray-400 font-mono">{s.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.isClosed ? "bg-gray-100 text-gray-600" : "bg-emerald-100 text-emerald-700"}`}>
                      {s.isClosed ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-50"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">{editing ? "Editar estado" : "Nuevo estado"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{formError}</div>}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nombre *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                  <span className="text-sm font-mono text-gray-500">{form.color}</span>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={form.isClosed} onChange={(e) => setForm({ ...form, isClosed: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500" />
                Este estado cierra el ticket
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-lg text-sm font-medium">
                  {saving ? "Guardando..." : editing ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">¿Eliminar estado?</h3>
            <p className="text-sm text-gray-500 mb-6">Solo si no tiene tickets asociados.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg text-sm font-medium">
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
