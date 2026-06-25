import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import { BookOpen, Plus, Search } from "lucide-react";

export const metadata: Metadata = { title: "Base de Conocimiento" };

const categories = [
  "Redes", "VMware", "SQL Server", "Oracle",
  "Power BI", "Office 365", "Linux", "Procedimientos",
];

export default function ConocimientoPage() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Base de Conocimiento</h1>
            <p className="text-sm text-gray-500 mt-0.5">Artículos y documentación técnica</p>
          </div>
          <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus size={15} />
            Nuevo Artículo
          </button>
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar en la base de conocimiento..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {categories.map((cat) => (
            <button key={cat} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-left hover:border-emerald-300 hover:shadow-md transition-all">
              <BookOpen size={20} className="text-teal-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">{cat}</p>
              <p className="text-xs text-gray-400 mt-0.5">0 artículos</p>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 flex flex-col items-center justify-center gap-3">
          <BookOpen size={28} className="text-teal-400" />
          <p className="text-gray-500 text-sm">No hay artículos publicados</p>
        </div>
      </div>
    </div>
  );
}
