"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { ArrowLeft, AlertTriangle, ChevronDown, Plus } from "lucide-react";

interface Category { id: string; name: string; }

export default function NuevoArticuloPage() {
  const router = useRouter();

  const [categories,  setCategories]  = useState<Category[]>([]);
  const [title,       setTitle]       = useState("");
  const [content,     setContent]     = useState("");
  const [categoryId,  setCategoryId]  = useState("");
  const [published,   setPublished]   = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [newCatName,  setNewCatName]  = useState("");
  const [addingCat,   setAddingCat]   = useState(false);
  const [savingCat,   setSavingCat]   = useState(false);

  useEffect(() => {
    fetch("/api/conocimiento/categorias")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []));
  }, []);

  async function createCategory() {
    if (!newCatName.trim()) return;
    setSavingCat(true);
    const res = await fetch("/api/conocimiento/categorias", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName.trim() }),
    });
    const d = await res.json();
    if (res.ok) {
      setCategories((c) => [...c, d.category]);
      setCategoryId(d.category.id);
      setNewCatName(""); setAddingCat(false);
    }
    setSavingCat(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) { setError("Título y contenido son obligatorios"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/conocimiento", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(), content: content.trim(),
          categoryId: categoryId || undefined, published,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.message ?? "Error al crear"); return; }
      router.push(`/conocimiento/${d.article.id}`);
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-6">

          <Link href="/conocimiento"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5">
            <ArrowLeft size={14} /> Volver a conocimiento
          </Link>

          <h1 className="text-xl font-bold text-gray-800 mb-6">Nuevo Artículo</h1>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Metadatos */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Información</h2>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Título *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required
                  placeholder="Ej: Cómo configurar VPN en Windows 11"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-600">Categoría</label>
                  <button type="button" onClick={() => setAddingCat(!addingCat)}
                    className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium">
                    <Plus size={11} /> Nueva categoría
                  </button>
                </div>

                {addingCat ? (
                  <div className="flex gap-2">
                    <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Nombre de categoría..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                    <button type="button" onClick={createCategory} disabled={savingCat}
                      className="px-3 py-2 bg-teal-500 text-white text-xs rounded-lg disabled:opacity-50">
                      {savingCat ? "..." : "Crear"}
                    </button>
                    <button type="button" onClick={() => setAddingCat(false)}
                      className="px-3 py-2 border border-gray-200 text-gray-500 text-xs rounded-lg">
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-teal-400">
                      <option value="">Sin categoría</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)}
                  className="w-4 h-4 accent-teal-500" />
                <span className="text-sm text-gray-600">Publicar inmediatamente</span>
              </label>
            </div>

            {/* Contenido */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">Contenido *</h2>
                <span className="text-xs text-gray-400">{content.length} caracteres</span>
              </div>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} required
                rows={20} placeholder={"Escribe el contenido del artículo...\n\nPuedes usar texto plano o Markdown:\n# Título\n## Subtítulo\n- Lista\n**Negrita** *Cursiva*\n```código```"}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none leading-relaxed" />
            </div>

            <div className="flex items-center justify-end gap-3 pb-6">
              <Link href="/conocimiento"
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg">
                Cancelar
              </Link>
              <button type="submit" disabled={loading}
                className="px-6 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white text-sm font-medium rounded-lg transition-colors">
                {loading ? "Publicando..." : published ? "Publicar artículo" : "Guardar borrador"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
