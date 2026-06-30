"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart3, Clock, Users, CheckCircle2, TrendingUp,
  AlertTriangle, XCircle, FileText, Monitor, Shield,
} from "lucide-react";

interface KPIs {
  totalTickets: number; openTickets: number; closedInRange: number;
  slaBreached: number; slaCompliance: number | null; avgResolutionH: number | null;
}
interface BreakdownItem { name: string; color?: string | null; count: number; }
interface TrendDay { day: string; count: number; }
interface Alerts { contractsExpiring: number; assetsInMaintenance: number; credsExpiring: number; }
interface Report {
  period: { days: number };
  kpis: KPIs;
  breakdowns: {
    byStatus:   BreakdownItem[];
    byCategory: BreakdownItem[];
    byPriority: BreakdownItem[];
    techLoad:   (BreakdownItem & { id: string })[];
  };
  trend: TrendDay[];
  alerts: Alerts;
}

const PERIOD_OPTIONS = [
  { label: "7 días",  value: 7 },
  { label: "14 días", value: 14 },
  { label: "30 días", value: 30 },
  { label: "90 días", value: 90 },
];

function Bar({ value, max, color = "#10b981" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-6 text-right">{value}</span>
    </div>
  );
}

function MiniTrend({ trend }: { trend: TrendDay[] }) {
  if (!trend.length) return <div className="h-16 flex items-center justify-center text-xs text-gray-400">Sin datos</div>;
  const max = Math.max(...trend.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {trend.map((d) => {
        const h = Math.max(4, Math.round((d.count / max) * 60));
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group relative" title={`${d.day}: ${d.count}`}>
            <div className="w-full rounded-sm bg-emerald-400 hover:bg-emerald-500 transition-colors"
              style={{ height: `${h}px` }} />
          </div>
        );
      })}
    </div>
  );
}

function SlaDonut({ pct }: { pct: number | null }) {
  if (pct === null) return <div className="text-sm text-gray-400">Sin datos SLA</div>;
  const color = pct >= 90 ? "#10b981" : pct >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"
            stroke={color}
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
          {pct}%
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{pct}%</p>
        <p className="text-xs text-gray-400">Cumplimiento</p>
      </div>
    </div>
  );
}

export default function ReportesClient() {
  const [days,    setDays]    = useState(30);
  const [report,  setReport]  = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/reportes?days=${days}`);
    if (res.ok) setReport(await res.json());
    setLoading(false);
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const maxStatus   = Math.max(...(report?.breakdowns.byStatus.map((s) => s.count)   ?? [1]), 1);
  const maxCategory = Math.max(...(report?.breakdowns.byCategory.map((c) => c.count) ?? [1]), 1);
  const maxTech     = Math.max(...(report?.breakdowns.techLoad.map((t) => t.count)   ?? [1]), 1);

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Dashboard ejecutivo y métricas del sistema</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {PERIOD_OPTIONS.map((o) => (
            <button key={o.value} onClick={() => setDays(o.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                days === o.value ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"
              }`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-sm text-gray-400">Cargando reportes...</div>
      ) : !report ? (
        <div className="text-center py-20 text-sm text-red-400">Error al cargar</div>
      ) : (
        <div className="space-y-5">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: "Tickets período", value: report.kpis.totalTickets,  icon: BarChart3,    color: "text-blue-500    bg-blue-50"     },
              { label: "Abiertos",        value: report.kpis.openTickets,   icon: Clock,        color: "text-orange-500  bg-orange-50"   },
              { label: "Cerrados",        value: report.kpis.closedInRange, icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50"  },
              { label: "SLA vencido",     value: report.kpis.slaBreached,   icon: XCircle,      color: "text-red-500     bg-red-50"      },
              { label: "T. Resolución",   value: report.kpis.avgResolutionH !== null ? `${report.kpis.avgResolutionH}h` : "—",
                icon: TrendingUp, color: "text-purple-500  bg-purple-50"  },
              { label: "Técnicos",        value: report.breakdowns.techLoad.length,
                icon: Users, color: "text-cyan-500    bg-cyan-50"     },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color.split(" ")[1]}`}>
                  <Icon size={17} className={color.split(" ")[0]} />
                </div>
                <p className="text-2xl font-bold text-gray-800 leading-none">{value}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </div>

          {/* Alertas cross-módulo */}
          {(report.alerts.contractsExpiring > 0 || report.alerts.assetsInMaintenance > 0 || report.alerts.credsExpiring > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {report.alerts.contractsExpiring > 0 && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <FileText size={18} className="text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-700">{report.alerts.contractsExpiring} contratos</p>
                    <p className="text-xs text-amber-600">vencen en 30 días</p>
                  </div>
                </div>
              )}
              {report.alerts.assetsInMaintenance > 0 && (
                <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <Monitor size={18} className="text-orange-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-orange-700">{report.alerts.assetsInMaintenance} equipos</p>
                    <p className="text-xs text-orange-600">en mantención</p>
                  </div>
                </div>
              )}
              {report.alerts.credsExpiring > 0 && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <Shield size={18} className="text-red-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">{report.alerts.credsExpiring} credenciales</p>
                    <p className="text-xs text-red-600">vencen en 30 días</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fila 2: Tendencia + SLA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Tendencia */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <TrendingUp size={14} className="text-emerald-500" /> Tendencia últimos 14 días
                </h2>
              </div>
              <MiniTrend trend={report.trend} />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-400">{report.trend[0]?.day ?? ""}</span>
                <span className="text-xs text-gray-400">{report.trend[report.trend.length - 1]?.day ?? ""}</span>
              </div>
            </div>

            {/* SLA */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <AlertTriangle size={14} className="text-orange-500" /> Cumplimiento SLA
              </h2>
              <SlaDonut pct={report.kpis.slaCompliance} />
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Vencidos</span>
                  <span className="text-red-600 font-semibold">{report.kpis.slaBreached}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fila 3: Por estado + Por categoría + Técnicos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Por estado */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Tickets por estado</h2>
              <div className="space-y-3">
                {report.breakdowns.byStatus
                  .sort((a, b) => b.count - a.count)
                  .map((s) => (
                    <div key={s.name}>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{s.name}</span>
                      </div>
                      <Bar value={s.count} max={maxStatus} color={s.color ?? "#6366f1"} />
                    </div>
                  ))}
              </div>
            </div>

            {/* Por categoría */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Tickets por categoría</h2>
              <div className="space-y-3">
                {report.breakdowns.byCategory
                  .filter((c) => c.count > 0)
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 8)
                  .map((c) => (
                    <div key={c.name}>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span className="truncate">{c.name}</span>
                      </div>
                      <Bar value={c.count} max={maxCategory} color={c.color ?? "#0ea5e9"} />
                    </div>
                  ))}
                {report.breakdowns.byCategory.every((c) => c.count === 0) && (
                  <p className="text-xs text-gray-400 text-center py-4">Sin tickets en este período</p>
                )}
              </div>
            </div>

            {/* Carga técnicos */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Carga por técnico</h2>
              <div className="space-y-3">
                {report.breakdowns.techLoad.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Sin técnicos</p>
                ) : (
                  report.breakdowns.techLoad
                    .sort((a, b) => b.count - a.count)
                    .map((t) => (
                      <div key={t.id}>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span className="truncate">{t.name}</span>
                        </div>
                        <Bar value={t.count} max={maxTech} color="#8b5cf6" />
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Prioridades */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Distribución por prioridad</h2>
            <div className="flex gap-4 flex-wrap">
              {report.breakdowns.byPriority.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color ?? "#aaa" }} />
                  <span className="text-sm text-gray-600">{p.name}</span>
                  <span className="text-sm font-bold text-gray-800">{p.count}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
