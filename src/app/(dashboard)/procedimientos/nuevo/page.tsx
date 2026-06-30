"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import {
  ArrowLeft, Plus, Trash2, GripVertical, AlertTriangle, ChevronDown,
} from "lucide-react";

interface Step {
  id: string;
  title: string;
  content: string;
  isWarning: boolean;
}

const CATEGORIES = [
  "Redes", "VMware", "SQL Server", "Oracle",
  "Power BI", "Office 365", "Linux", "General",
];

function uid() { return Math.random().toString(36).slice(2); }

export default function NuevoProcedimientoPage() {
  const router = useRouter();

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [category,    setCategory]    = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [steps,       setSteps]       = useState<Step[]>([
    { id: uid(), title: "", content: "", isWarning: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  function addStep() {
    setSteps((s) => [...s, { id: uid(), title: "", content: "", isWarning: false }]);
  }

  function removeStep(id: string) {
    setSteps((s) => s.filter((st) => st.id !== id));
  }

  function updateStep(id: string, field: keyof Step, value: string | boolean) {
    setSteps((s) => s.map((st) => st.id === id ? { ...st, [field]: value } : st));
  }

  function moveStep(idx: number, dir: -1 | 1) {
    const arr = [...steps];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setSteps(arr);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("El título es obligatorio"); return; }
    const validSteps = steps.filter((s) => s.title.trim());
    if (validSteps.length === 0) { setError("Agrega al menos un paso con título"); return; }

    setError(""); setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        isPublished,
        steps: validSteps.map((s, i) => ({
          order:     i,
          title:     s.title.trim(),
          content:   s.content.trim() || undefined,
          isWarning: s.isWarning,
        })),
      };
      const res = await fetch("/api/procedimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Error al crear"); return; }
      router.push(`/procedimientos/${data.procedure.id}`);
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-6">

          {/* Back */}
          <Link href="/procedimientos"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5">
            <ArrowLeft size={14} /> Volver a procedimientos
          </Link>

          <h1 className="text-xl font-bold text-gray-800 mb-6">Nuevo Procedimiento</h1>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Info card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Información general</h2>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Título *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required
                  placeholder="Ej: Procedimiento de backup semanal"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={2} placeholder="Breve descripción del procedimiento..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Categoría</label>
                  <div className="relative">
                    <select value={category} onChange={(e) => setCategory(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-400">
                      <option value="">Sin categoría</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Visibilidad</label>
                  <label className="flex items-center gap-2.5 cursor-pointer mt-2">
                    <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500" />
                    <span className="text-sm text-gray-600">Publicado</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700">
                  Pasos del procedimiento
                  <span className="ml-2 text-xs font-normal text-gray-400">({steps.length})</span>
                </h2>
                <button type="button" onClick={addStep}
                  className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                  <Plus size={13} /> Agregar paso
                </button>
              </div>

              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div key={step.id}
                    className={`border rounded-lg p-4 ${step.isWarning ? "border-amber-200 bg-amber-50" : "border-gray-100 bg-gray-50"}`}>

                    <div className="flex items-start gap-3">
                      {/* Order handle + number */}
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <button type="button" onClick={() => moveStep(idx, -1)}
                          disabled={idx === 0}
                          className="text-gray-300 hover:text-gray-500 disabled:opacity-20 leading-none">▲</button>
                        <span className="text-xs font-bold text-gray-400 w-5 text-center">{idx + 1}</span>
                        <button type="button" onClick={() => moveStep(idx, 1)}
                          disabled={idx === steps.length - 1}
                          className="text-gray-300 hover:text-gray-500 disabled:opacity-20 leading-none">▼</button>
                      </div>

                      <div className="flex-1 space-y-2">
                        <input value={step.title} onChange={(e) => updateStep(step.id, "title", e.target.value)}
                          placeholder={`Título del paso ${idx + 1}...`}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white" />
                        <textarea value={step.content} onChange={(e) => updateStep(step.id, "content", e.target.value)}
                          placeholder="Descripción o instrucciones (opcional)..."
                          rows={2}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none bg-white" />
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={step.isWarning}
                            onChange={(e) => updateStep(step.id, "isWarning", e.target.checked)}
                            className="w-3.5 h-3.5 accent-amber-500" />
                          <span className="text-xs text-amber-600 flex items-center gap-1">
                            <AlertTriangle size={11} /> Marcar como advertencia
                          </span>
                        </label>
                      </div>

                      <button type="button" onClick={() => removeStep(step.id)}
                        disabled={steps.length === 1}
                        className="text-gray-300 hover:text-red-400 disabled:opacity-20 mt-1 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addStep}
                className="w-full mt-3 py-2 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400 hover:border-emerald-300 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1.5">
                <Plus size={12} /> Agregar paso
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pb-6">
              <Link href="/procedimientos"
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg">
                Cancelar
              </Link>
              <button type="submit" disabled={loading}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white text-sm font-medium rounded-lg transition-colors">
                {loading ? "Guardando..." : "Crear Procedimiento"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
