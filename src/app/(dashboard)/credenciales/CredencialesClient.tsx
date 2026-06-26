"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, Eye, EyeOff, Lock, Pencil, Trash2,
  ShieldCheck, Globe, User, X, Copy, Check,
} from "lucide-react";

interface Credential {
  id: string;
  name: string;
  username: string;
  url?: string | null;
  notes?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  owner?: { name: string; lastname: string } | null;
}

const EMPTY_FORM = {
  name: "", username: "", password: "",
  url: "", notes: "", expiresAt: "",
};

export default function CredencialesClient() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Credential | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showFormPwd, setShowFormPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Reveal
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [revealing, setRevealing] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/credentials");
      if (!res.ok) {
        const d = await res.json();
        setError(d.message ?? "Error al cargar");
        return;
      }
      const data = await res.json();
      setCredentials(data.credentials);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCredentials(); }, [fetchCredentials]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowFormPwd(false);
    setShowModal(true);
  }

  function openEdit(c: Credential) {
    setEditing(c);
    setForm({
      name: c.name,
      username: c.username,
      password: "",
      url: c.url ?? "",
      notes: c.notes ?? "",
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "",
    });
    setFormError("");
    setShowFormPwd(false);
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        username: form.username,
        url: form.url || undefined,
        notes: form.notes || undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      };
      if (!editing || form.password) payload.password = form.password;

      const res = await fetch(
        editing ? `/api/credentials/${editing.id}` : "/api/credentials",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) { setFormError(data.message ?? "Error al guardar"); return; }
      setShowModal(false);
      fetchCredentials();
    } catch {
      setFormError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  async function handleReveal(id: string) {
    if (revealed[id]) {
      setRevealed((prev) => { const n = { ...prev }; delete n[id]; return n; });
      return;
    }
    setRevealing(id);
    try {
      const res = await fetch(`/api/credentials/${id}/reveal`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { alert(data.message ?? "Sin permiso"); return; }
      setRevealed((prev) => ({ ...prev, [id]: data.password }));
    } finally {
      setRevealing(null);
    }
  }

  async function handleCopy(id: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/credentials/${deleteId}`, { method: "DELETE" });
      if (res.ok) { setDeleteId(null); fetchCredentials(); }
      else { const d = await res.json(); alert(d.message ?? "Error al eliminar"); }
    } finally {
      setDeleting(false);
    }
  }

  function isExpiringSoon(expiresAt?: string | null) {
    if (!expiresAt) return false;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 1000 * 60 * 60 * 24 * 30;
  }

  function isExpired(expiresAt?: string | null) {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() < Date.now();
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Credenciales Seguras</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Accesos cifrados con AES-256 · Auditoría completa
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={15} />
          Nueva Credencial
        </button>
      </div>

      {/* Banner seguridad */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
        <Lock size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">
          Las contraseñas se almacenan cifradas con <strong>AES-256-CBC</strong>.
          Cada visualización queda registrada en el log de auditoría.
        </p>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-400">
          Cargando...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-600 text-center">
          {error}
        </div>
      ) : credentials.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 flex flex-col items-center gap-3">
          <ShieldCheck size={28} className="text-gray-300" />
          <p className="text-gray-400 text-sm">No hay credenciales registradas</p>
          <button onClick={openCreate} className="text-sm text-emerald-500 hover:underline">
            Crear la primera
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuario</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contraseña</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">URL</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vence</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {credentials.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <Lock size={13} className="text-emerald-500" />
                      </div>
                      <span className="font-medium text-gray-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <User size={13} className="text-gray-400" />
                      {c.username}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-gray-700 text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {revealed[c.id] ? revealed[c.id] : "••••••••"}
                      </span>
                      {revealed[c.id] && (
                        <button
                          onClick={() => handleCopy(c.id, revealed[c.id])}
                          className="text-gray-400 hover:text-emerald-500 transition-colors"
                          title="Copiar"
                        >
                          {copied === c.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                      )}
                      <button
                        onClick={() => handleReveal(c.id)}
                        disabled={revealing === c.id}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title={revealed[c.id] ? "Ocultar" : "Revelar"}
                      >
                        {revealed[c.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.url ? (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-emerald-500 hover:underline text-xs"
                      >
                        <Globe size={12} />
                        {new URL(c.url).hostname}
                      </a>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.expiresAt ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        isExpired(c.expiresAt)
                          ? "bg-red-100 text-red-600"
                          : isExpiringSoon(c.expiresAt)
                          ? "bg-amber-100 text-amber-600"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {new Date(c.expiresAt).toLocaleDateString("es-CL")}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteId(c.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">
                {editing ? "Editar credencial" : "Nueva credencial"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-600 mb-1">Nombre *</label>
                <input
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required placeholder="ej: Servidor producción"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Usuario *</label>
                <input
                  value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required placeholder="ej: admin"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Contraseña {editing ? "(dejar vacío para mantener)" : "*"}
                </label>
                <div className="relative">
                  <input
                    type={showFormPwd ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={!editing}
                    placeholder={editing ? "••••••••" : "Contraseña segura"}
                    className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPwd(!showFormPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showFormPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">URL</label>
                <input
                  type="url" value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Fecha de vencimiento</label>
                <input
                  type="date" value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Notas</label>
                <textarea
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2} placeholder="Observaciones opcionales..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {saving ? "Guardando..." : editing ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={20} className="text-red-500" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">
              ¿Eliminar credencial?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg text-sm font-medium"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
