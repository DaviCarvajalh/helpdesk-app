"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, BookOpen, Eye, Globe, Lock, Tag } from "lucide-react";

interface Category { id: string; name: string; _count: { articles: number }; }
interface Article {
  id: string; title: string; published: boolean; views: number;
  createdAt: string; updatedAt: string;
  category?: { id: string; name: string } | null;
  author: { id: string; name: string; lastname: string };
}

export default function ConocimientoClient() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [articles,   setArticles]   = useState<Article[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/conocimiento/categorias");
    if (res.ok) setCategories((await res.json()).categories ?? []);
  }, []);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search)         p.set("q",          search);
    if (activeCategory) p.set("categoryId", activeCategory);
    const res = await fetch(`/api/conocimiento?${p}`);
    if (res.ok) setArticles((await res.json()).articles ?? []);
    setLoading(false);
  }, [search, activeCategory]);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { loadArticles();   }, [loadArticles]);

  const totalArticles = categories.reduce((s, c) => s + c._count.articles, 0);

  return (
    <div className="flex-1 flex overflow-hidden">

      {/* Sidebar categorías */}
      <div className="w-56 shrink-0 border-r border-gray-100 bg-white flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Categorías</p>
        </div>
        <div className="flex-1 p-2 space-y-0.5">
          {/* Todos */}
          <button onClick={() => setActiveCategory("")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              !activeCategory ? "bg-teal-50 text-teal-700 font-medium" : "text-gray-600 hover:bg-gray-50"
            }`}>
            <span className="flex items-center gap-2"><BookOpen size={13} /> Todos</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${!activeCategory ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"}`}>
              {totalArticles}
            </span>
          </button>

          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                activeCategory === cat.id ? "bg-teal-50 text-teal-700 font-medium" : "text-gray-600 hover:bg-gray-50"
              }`}>
              <span className="flex items-center gap-2 truncate">
                <Tag size={12} className="shrink-0" />
                <span className="truncate">{cat.name}</span>
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${
                activeCategory === cat.id ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"
              }`}>
                {cat._count.articles}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en la base de conocimiento..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <Link href="/conocimiento/nuevo"
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors shrink-0">
            <Plus size={15} /> Nuevo Artículo
          </Link>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-16 text-sm text-gray-400">Cargando...</div>
          ) : articles.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 flex flex-col items-center gap-3">
              <BookOpen size={32} className="text-teal-300" />
              <p className="text-gray-500 text-sm">No hay artículos en esta categoría</p>
              <Link href="/conocimiento/nuevo" className="text-teal-600 text-sm font-medium hover:underline flex items-center gap-1">
                <Plus size={13} /> Crear el primero
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((a) => (
                <div key={a.id}
                  onClick={() => router.push(`/conocimiento/${a.id}`)}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        {a.category && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 font-medium shrink-0">
                            {a.category.name}
                          </span>
                        )}
                        {a.published
                          ? <Globe size={12} className="text-emerald-500 shrink-0" />
                          : <Lock   size={12} className="text-gray-400  shrink-0" />}
                      </div>
                      <h3 className="text-sm font-semibold text-gray-800 line-clamp-1">{a.title}</h3>
                      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-3">
                        <span>{a.author.name} {a.author.lastname}</span>
                        <span>·</span>
                        <span>{new Date(a.updatedAt).toLocaleDateString("es-CL")}</span>
                        <span className="flex items-center gap-1">
                          <Eye size={11} /> {a.views}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
