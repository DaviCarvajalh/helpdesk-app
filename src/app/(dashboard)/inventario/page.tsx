import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import { Monitor, Plus, Search } from "lucide-react";

export const metadata: Metadata = { title: "Inventario" };

export default function InventarioPage() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Inventario TI</h1>
            <p className="text-sm text-gray-500 mt-0.5">Equipos y activos de tecnología</p>
          </div>
          <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus size={15} />
            Nuevo Equipo
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {["Servidores", "PCs / Notebooks", "Switches / AP", "Impresoras"].map((cat) => (
            <div key={cat} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
              <Monitor size={24} className="text-sky-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">{cat}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">0</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 flex flex-col items-center justify-center gap-3">
          <Monitor size={28} className="text-sky-400" />
          <p className="text-gray-500 text-sm">No hay equipos registrados</p>
        </div>
      </div>
    </div>
  );
}
