import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import { Settings, Users, Tag, Clock, Building2 } from "lucide-react";

export const metadata: Metadata = { title: "Configuración" };

const sections = [
  { label: "Usuarios y Roles", icon: Users, desc: "Administrar usuarios, roles y permisos" },
  { label: "Categorías", icon: Tag, desc: "Categorías de tickets e inventario" },
  { label: "SLA", icon: Clock, desc: "Tiempos de respuesta y resolución" },
  { label: "Empresa", icon: Building2, desc: "Datos de la organización" },
];

export default function ConfiguracionPage() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ajustes del sistema</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sections.map(({ label, icon: Icon, desc }) => (
            <button
              key={label}
              className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm text-left flex items-center gap-4 hover:border-emerald-300 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
