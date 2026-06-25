import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import { ShieldCheck, Plus, Eye, EyeOff, Lock } from "lucide-react";

export const metadata: Metadata = { title: "Credenciales" };

export default function CredencialesPage() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Credenciales Seguras</h1>
            <p className="text-sm text-gray-500 mt-0.5">Accesos cifrados con AES-256 · Auditoría completa</p>
          </div>
          <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus size={15} />
            Nueva Credencial
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <Lock size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Módulo de seguridad activo</p>
            <p className="text-xs text-amber-700 mt-0.5">Las contraseñas se almacenan cifradas con AES-256. Nunca se muestra la contraseña completa.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 flex flex-col items-center justify-center gap-3">
          <ShieldCheck size={28} className="text-yellow-400" />
          <p className="text-gray-500 text-sm">No hay credenciales registradas</p>
        </div>
      </div>
    </div>
  );
}
