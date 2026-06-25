import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import { BarChart3, TrendingUp, Users, Clock, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = { title: "Reportes" };

const reportCards = [
  { label: "Tickets por mes", icon: BarChart3, color: "text-blue-500", bg: "bg-blue-50" },
  { label: "Cumplimiento SLA", icon: Clock, color: "text-orange-500", bg: "bg-orange-50" },
  { label: "Técnicos eficientes", icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
  { label: "Resolucion promedio", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
];

export default function ReportesPage() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Dashboard ejecutivo y métricas</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {reportCards.map(({ label, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon size={20} className={color} />
              </div>
              <p className="text-sm font-medium text-gray-700">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">Sin datos aún</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 flex flex-col items-center justify-center gap-3">
          <BarChart3 size={28} className="text-pink-400" />
          <p className="text-gray-500 text-sm">Conecte una base de datos para ver reportes</p>
        </div>
      </div>
    </div>
  );
}
