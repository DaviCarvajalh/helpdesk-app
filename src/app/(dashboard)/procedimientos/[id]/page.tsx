"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import {
  ArrowLeft, ClipboardList, AlertTriangle, CheckCircle2,
  Globe, Lock, Pencil, Trash2, BookOpen,
} from "lucide-react";

interface Step {
  id: string; order: number; title: string;
  content?: string | null; isWarning: boolean;
}
interface Procedure {
  id: string; title: string; description?: string | null;
  category?: string | null; isPublished: boolean;
  createdAt: string; updatedAt: string; createdBy?: string | null;
  steps: Step[];
}

export default function ProcedimientoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);

  // Checklist state (local only, no persistencia)
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    const res = await fetch(`/api/procedimientos/${id}`);
    if (res.status === 404) { setNotFound(true); setLoading(false); return; }
    if (res.ok) setProcedure((await res.json()).procedure);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function toggleCheck(stepId: string) {
    setChecked((c) => ({ ...c, [stepId]: !c[stepId] }));
  }

  function resetChecklist() {
    setChecked({});
  }

  async function togglePublish() {
    if (!procedure) return;
    await fetch(`/api/procedimientos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !procedure.isPublished }),
    });
    load();
  }

  async function deleteProcedure() {
    if (!confirm("¿Eliminar este procedimiento?")) return;
    await fetch(`/api/procedimientos/${id}`, { method: "DELETE" });
    router.push("/procedimientos");
  }

  if (loading) return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
        Cargando...
      </div>
    </div>
  );

  if (notFound || !procedure) return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <ClipboardList size={32} className="text-gray-300" />
        <p className="text-gray-500">Procedimiento no encontrado</p>
        <Link href="/procedimientos" className="text-emerald-600 text-sm hover:underline">
          Volver a procedimientos
        </Link>
      </div>
    </div>
  );

  const doneCount = procedure.steps.filter((s) => checked[s.id]).length;
  const progress  = procedure.steps.length > 0
    ? Math.round((doneCount / procedure.steps.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-6">

          {/* Back + actions */}
          <div className="flex items-center justify-between mb-5">
            <Link href="/procedimientos"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft size={14} /> Procedimientos
            </Link>
            <div className="flex items-center gap-2">
              <button onClick={togglePublish}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  procedure.isPublished
                    ? "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                    : "border-gray-200 text-gray-500 bg-white hover:bg-gray-50"
                }`}>
                {procedure.isPublished ? <><Globe size={12} /> Publicado</> : <><Lock size={12} /> Borrador</>}
              </button>
              <Link href={`/procedimientos/${id}/editar`}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
                <Pencil size={12} /> Editar
              </Link>
              <button onClick={deleteProcedure}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-500 hover:bg-red-50">
                <Trash2 size={12} /> Eliminar
              </button>
            </div>
          </div>

          {/* Header card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <ClipboardList size={22} className="text-blue-500" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-800">{procedure.title}</h1>
                {procedure.category && (
                  <span className="inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                    {procedure.category}
                  </span>
                )}
                {procedure.description && (
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">{procedure.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <BookOpen size={11} /> {procedure.steps.length} pasos
                  </span>
                  <span>Actualizado {new Date(procedure.updatedAt).toLocaleDateString("es-CL")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checklist progress */}
          {procedure.steps.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-700">Checklist de ejecución</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {doneCount} de {procedure.steps.length} pasos completados
                  </p>
                </div>
                {doneCount > 0 && (
                  <button onClick={resetChecklist}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                    Reiniciar
                  </button>
                )}
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }} />
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {procedure.steps.map((step, idx) => {
                  const done = !!checked[step.id];
                  return (
                    <div key={step.id}
                      onClick={() => toggleCheck(step.id)}
                      className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all select-none ${
                        done
                          ? "bg-emerald-50 border-emerald-200"
                          : step.isWarning
                            ? "bg-amber-50 border-amber-200 hover:border-amber-300"
                            : "bg-gray-50 border-gray-100 hover:border-gray-200"
                      }`}>

                      {/* Checkbox */}
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        done ? "bg-emerald-500 border-emerald-500" : "border-gray-300"
                      }`}>
                        {done && <CheckCircle2 size={14} className="text-white" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-gray-400">Paso {idx + 1}</span>
                          {step.isWarning && (
                            <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                              <AlertTriangle size={11} /> Advertencia
                            </span>
                          )}
                        </div>
                        <p className={`text-sm font-medium ${done ? "line-through text-gray-400" : "text-gray-800"}`}>
                          {step.title}
                        </p>
                        {step.content && (
                          <p className={`text-xs mt-1 leading-relaxed ${done ? "text-gray-400" : "text-gray-500"}`}>
                            {step.content}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* All done message */}
              {doneCount === procedure.steps.length && procedure.steps.length > 0 && (
                <div className="mt-4 flex items-center gap-2 bg-emerald-500 text-white rounded-lg px-4 py-3 text-sm font-medium">
                  <CheckCircle2 size={16} /> ¡Procedimiento completado!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
