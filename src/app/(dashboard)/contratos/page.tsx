import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import { FileText, Plus } from "lucide-react";

export const metadata: Metadata = { title: "Contratos" };

export default function ContratosPage() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Contratos</h1>
            <p className="text-sm text-gray-500 mt-0.5">Clientes, contratos y renovaciones</p>
          </div>
          <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus size={15} />
            Nuevo Contrato
          </button>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 flex flex-col items-center justify-center gap-3">
          <FileText size={28} className="text-purple-400" />
          <p className="text-gray-500 text-sm">No hay contratos registrados</p>
        </div>
      </div>
    </div>
  );
}
