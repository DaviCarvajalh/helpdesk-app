"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import {
  ArrowLeft, BookOpen, Eye, Globe, Lock, Pencil,
  Trash2, Save, X, ChevronDown, AlertTriangle,
} from "lucide-react";

interface Category { id: string; name: string; }
interface Article {
  id: string; title: string; content: string; published: boolean; views: number;
  createdAt: string; updatedAt: string;
  category?: { id: string; name: string } | null;
  author: { id: string; name: string; lastname: string };
}

export default function ArticuloDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [article,    setArticle]    = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [editing,    setEditing]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  const [editTitle,      setEditTitle]      = useState("");
  const [editContent,    setEditContent]    = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editPublished,  setEditPublished]  = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/conocimiento/${id}`);
    if (res.status === 404) { setNotFound(true); setLoading(false); return; }
    if (res.ok) {
      const { article: a } = await res.json();
      setArticle(a);
      setEditTitle(a.title);
      setEditContent(a.content);
      setEditCategoryId(a.category?.id ?? "");
      setEditPublished(a.published);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch("/api/conocimiento/categorias")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []));
  }, []);

  async function saveEdit() {
    setError(""); setSaving(true);
    const res = await fetch(`/api/conocimiento/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title:      editTitle.trim(),
        content:    editContent.trim(),
        categoryId: editCategoryId || null,
        published:  editPublished,
      }),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.message ?? "Error al guardar"); setSaving(false); return; }
    setEditing(false); setSaving(false);
    load();
  }

  async function deleteArticle() {
    if (!confirm("¿Eliminar este artículo?")) return;
    await fetch(`/api/conocimiento/${id}`, { method: "DELETE" });
    router.push("/conocimiento");
  }

  if (loading) return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Cargando...</div>
    </div>
  );

  if (notFound || !article) return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <BookOpen size={32} className="text-gray-300" />
        <p className="text-gray-500">Artículo no encontrado</p>
        <Link href="/conocimiento" className="text-teal-600 text-sm hover:underline">Volver</Link>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-6">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <Link href="/conocimiento"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft size={14} /> Base de Conocimiento
            </Link>
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <button onClick={() => { setEditing(false); setError(""); }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
                    <X size={12} /> Cancelar
                  </button>
                  <button onClick={saveEdit} disabled={saving}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white disabled:opacity-50">
                    <Save size={12} /> {saving ? "Guardando..." : "Guardar"}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
                    <Pencil size={12} /> Editar
                  </button>
                  <button onClick={deleteArticle}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-500 hover:bg-red-50">
                    <Trash2 size={12} /> Eliminar
                  </button>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {editing ? (
            /* Edit mode */
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-teal-200 shadow-sm p-5 space-y-4">
                <h2 className="text-sm font-semibold text-gray-700">Editando artículo</h2>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Título</label>
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Categoría</label>
                    <div className="relative">
                      <select value={editCategoryId} onChange={(e) => setEditCategoryId(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-teal-400">
                        <option value="">Sin categoría</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editPublished} onChange={(e) => setEditPublished(e.target.checked)}
                        className="w-4 h-4 accent-teal-500" />
                      <span className="text-sm text-gray-600">Publicado</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Contenido</label>
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                    rows={20}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none leading-relaxed" />
                </div>
              </div>
            </div>
          ) : (
            /* Read mode */
            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-2">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
                  {/* Header */}
                  <div className="mb-6 pb-6 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      {article.category && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-600 font-medium">
                          {article.category.name}
                        </span>
                      )}
                      <span className={`flex items-center gap-1 text-xs font-medium ${
                        article.published ? "text-emerald-600" : "text-gray-400"
                      }`}>
                        {article.published ? <><Globe size={11} /> Publicado</> : <><Lock size={11} /> Borrador</>}
                      </span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">{article.title}</h1>
                    <p className="text-xs text-gray-400 mt-2">
                      {article.author.name} {article.author.lastname} ·{" "}
                      {new Date(article.updatedAt).toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>

                  {/* Content */}
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {article.content}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3 text-sm">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Detalles</h2>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Eye size={13} className="text-gray-400" />
                    <span>{article.views} visualizaciones</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Creado</p>
                    <p className="text-gray-700">{new Date(article.createdAt).toLocaleDateString("es-CL")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Actualizado</p>
                    <p className="text-gray-700">{new Date(article.updatedAt).toLocaleDateString("es-CL")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Autor</p>
                    <p className="text-gray-700">{article.author.name} {article.author.lastname}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
