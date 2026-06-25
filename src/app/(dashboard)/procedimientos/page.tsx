import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import { ClipboardList, Plus, Search } from "lucide-react";

export const metadata: Metadata = { title: "Procedimientos" };

export default function ProcedimientosPage() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Procedimientos</h1>
            <p className="text-sm text-gray-500 mt-0.5">Guías y procedimientos internos</p>
          </div>
          <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus size={15} />
            Nuevo Procedimiento
          </button>
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar procedimientos..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 flex flex-col items-center justify-center gap-3">
          <ClipboardList size={28} className="text-blue-400" />
          <p className="text-gray-500 text-sm">No hay procedimientos registrados</p>
        </div>
      </div>
    </div>
  );
}
