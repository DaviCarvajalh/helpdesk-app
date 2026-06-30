"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import {
  ArrowLeft,
  AlertTriangle,
  FileText,
  User,
  Upload,
  X,
  Send,
} from "lucide-react";

interface Option { id: string; name: string; }
interface UserOption { id: string; name: string; lastname: string; }
interface Priority { id: string; name: string; level: number; color?: string | null; }

const EMPTY_FORM = {
  type: "incidente" as "incidente" | "requerimiento",
  title: "",
  requesterId: "",
  categoryId: "",
  priorityId: "",
  assigneeId: "",
  description: "",
};

export default function NewTicketPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm]       = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [categories, setCategories]   = useState<Option[]>([]);
  const [priorities, setPriorities]   = useState<Priority[]>([]);
  const [technicians, setTechnicians] = useState<UserOption[]>([]);
  const [users, setUsers]             = useState<UserOption[]>([]);
  const [images, setImages]           = useState<File[]>([]);

  const canSeeUsers = users.length > 0;

  useEffect(() => {
    fetch("/api/tickets/options")
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories ?? []);
        setPriorities(d.priorities ?? []);
        setTechnicians(d.technicians ?? []);
        setUsers(d.users ?? []);
      });
  }, []);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const valid = Array.from(files)
      .filter((f) => ["image/png", "image/jpeg"].includes(f.type) && f.size <= 5 * 1024 * 1024)
      .slice(0, 5 - images.length);
    setImages((prev) => [...prev, ...valid].slice(0, 5));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.priorityId) { setError("Selecciona una prioridad"); return; }
    setError("");
    setLoading(true);
    try {
      const payload = {
        type: form.type,
        title: form.title,
        description: form.description,
        priorityId: form.priorityId,
        categoryId: form.categoryId || undefined,
        assigneeId: form.assigneeId || undefined,
        requesterId: form.requesterId || undefined,
      };
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Error al crear el ticket"); return; }
      router.push("/tickets");
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-6">

          {/* Back */}
          <Link href="/tickets"
            className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 mb-4 transition-colors">
            <ArrowLeft size={14} />
            Volver a tickets
          </Link>

          <div className="mb-5">
            <h1 className="text-2xl font-bold text-gray-800">Nuevo Ticket</h1>
            <p className="text-sm text-gray-500 mt-0.5">Describe tu problema o solicitud</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">

              {/* Tipo de ticket */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Ticket <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { value: "incidente",     label: "Incidente",     sub: "Problema o falla",    Icon: AlertTriangle, active: "border-red-400 bg-red-50" },
                    { value: "requerimiento", label: "Requerimiento", sub: "Solicitud o mejora",  Icon: FileText,       active: "border-gray-300 bg-gray-50" },
                  ] as const).map(({ value, label, sub, Icon, active }) => (
                    <button key={value} type="button"
                      onClick={() => setForm({ ...form, type: value })}
                      className={`flex flex-col items-center gap-1.5 border-2 rounded-xl p-4 transition-all ${
                        form.type === value ? active + " shadow-sm" : "border-gray-200 hover:border-gray-300"
                      }`}>
                      <Icon size={18} className={form.type === value && value === "incidente" ? "text-red-500" : "text-gray-400"} />
                      <span className="text-sm font-semibold text-gray-800">{label}</span>
                      <span className="text-xs text-gray-400">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Titulo <span className="text-red-500">*</span>
                </label>
                <input type="text" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Resumen breve del problema" required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>

              {/* Quién reporta */}
              {canSeeUsers && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="inline-flex items-center gap-1.5"><User size={14} className="text-gray-400" /> Quien reporta</span>
                  </label>
                  <select value={form.requesterId}
                    onChange={(e) => setForm({ ...form, requesterId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                    <option value="">Yo mismo (usuario actual)</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} {u.lastname}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Selecciona si reportas en nombre de otra persona</p>
                </div>
              )}

              {/* Categoría + Prioridad */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoría</label>
                  <select value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                    <option value="">Seleccionar...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Prioridad <span className="text-red-500">*</span>
                  </label>
                  <select value={form.priorityId}
                    onChange={(e) => setForm({ ...form, priorityId: e.target.value })} required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                    <option value=""></option>
                    {priorities.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Asignar técnico */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="inline-flex items-center gap-1.5"><User size={14} className="text-gray-400" /> Asignar Técnico <span className="font-normal text-gray-400">(opcional)</span></span>
                </label>
                <select value={form.assigneeId}
                  onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                  <option value="">Sin asignar (cola general)</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} {t.lastname}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Si no seleccionas, el ticket irá a la cola de espera</p>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe detalladamente el problema o solicitud..."
                  required rows={5}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
              </div>

              {/* Imágenes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Imágenes del error <span className="font-normal text-gray-400">(opcional)</span>
                </label>

                {/* Previews */}
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {images.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                        <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                        <button type="button"
                          onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2 text-gray-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors cursor-pointer">
                  <Upload size={20} />
                  <span className="text-sm font-medium">Haz clic para subir imágenes</span>
                  <span className="text-xs">PNG, JPG hasta 5MB (máx. 5 imágenes)</span>
                </button>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg" multiple className="hidden"
                  onChange={(e) => handleFiles(e.target.files)} />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 mt-5">
              <Link href="/tickets"
                className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                Cancelar
              </Link>
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                <Send size={14} />
                {loading ? "Creando..." : "Crear Ticket"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
