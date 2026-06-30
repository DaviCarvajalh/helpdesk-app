"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { ArrowLeft, AlertTriangle, ChevronDown } from "lucide-react";

const CATEGORIES = ["PC", "Notebook", "Servidor", "Switch", "Router", "Impresora", "Monitor", "UPS", "Teléfono", "Otro"];
const ENVS        = ["production", "staging", "development", "testing"];
const CRITS       = ["critical", "high", "medium", "low"];

interface User { id: string; name: string; lastname: string; }

export default function NuevoActivoPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const tipo         = searchParams.get("tipo") === "infra" ? "infra" : "equipo";

  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Equipo fields
  const [assetCode,    setAssetCode]    = useState("");
  const [name,         setName]         = useState("");
  const [brand,        setBrand]        = useState("");
  const [model,        setModel]        = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [categoryId,   setCategoryId]   = useState("");
  const [status,       setStatus]       = useState("active");
  const [location,     setLocation]     = useState("");
  const [assignedTo,   setAssignedTo]   = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [warrantyEnd,  setWarrantyEnd]  = useState("");
  const [notes,        setNotes]        = useState("");

  // Infra fields
  const [hostname, setHostname] = useState("");
  const [ip,       setIp]       = useState("");
  const [os,       setOs]       = useState("");
  const [env,      setEnv]      = useState("");
  const [crit,     setCrit]     = useState("");
  const [infraNotes, setInfraNotes] = useState("");

  useEffect(() => {
    fetch("/api/tickets/options")
      .then((r) => r.json())
      .then((d) => setUsers(d.technicians ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (tipo === "equipo") {
        if (!assetCode || !name) { setError("Código y nombre son obligatorios"); setLoading(false); return; }
        const res = await fetch("/api/inventario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assetCode, name, brand: brand || undefined, model: model || undefined,
            serialNumber: serialNumber || undefined, categoryId: categoryId || undefined,
            status, location: location || undefined,
            assignedTo: assignedTo || undefined,
            purchaseDate: purchaseDate || undefined,
            warrantyEnd:  warrantyEnd  || undefined,
            notes: notes || undefined,
          }),
        });
        const d = await res.json();
        if (!res.ok) { setError(d.message ?? "Error al crear"); return; }
        router.push(`/inventario/${d.asset.id}`);
      } else {
        if (!hostname) { setError("Hostname es obligatorio"); setLoading(false); return; }
        const res = await fetch("/api/inventario/infra", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hostname, ipAddress: ip || undefined,
            operatingSystem: os || undefined,
            environment: env || undefined,
            criticality: crit || undefined,
            notes: infraNotes || undefined,
          }),
        });
        const d = await res.json();
        if (!res.ok) { setError(d.message ?? "Error al crear"); return; }
        router.push("/inventario");
      }
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-6">

          <Link href="/inventario"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5">
            <ArrowLeft size={14} /> Volver a inventario
          </Link>

          {/* Tipo toggle */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-800">
              {tipo === "equipo" ? "Nuevo Equipo" : "Nuevo Activo de Infraestructura"}
            </h1>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(["equipo", "infra"] as const).map((t) => (
                <Link key={t} href={`/inventario/nuevo?tipo=${t}`}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    tipo === t ? "bg-white shadow-sm text-gray-800" : "text-gray-500"
                  }`}>
                  {t === "equipo" ? "Equipo" : "Infraestructura"}
                </Link>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {tipo === "equipo" ? (
              <>
                {/* Identificación */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <h2 className="text-sm font-semibold text-gray-700">Identificación</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Código de activo *</label>
                      <input value={assetCode} onChange={(e) => setAssetCode(e.target.value)} required
                        placeholder="Ej: PC-001"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">N° de serie</label>
                      <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)}
                        placeholder="S/N..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre / Descripción *</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} required
                      placeholder="Ej: Notebook HP EliteBook 840"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Categoría</label>
                      <div className="relative">
                        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                          className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-400">
                          <option value="">Sin categoría</option>
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Marca</label>
                      <input value={brand} onChange={(e) => setBrand(e.target.value)}
                        placeholder="HP, Dell, Cisco..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Modelo</label>
                      <input value={model} onChange={(e) => setModel(e.target.value)}
                        placeholder="EliteBook 840..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    </div>
                  </div>
                </div>

                {/* Estado y ubicación */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <h2 className="text-sm font-semibold text-gray-700">Estado y ubicación</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Estado</label>
                      <div className="relative">
                        <select value={status} onChange={(e) => setStatus(e.target.value)}
                          className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-400">
                          <option value="active">Activo</option>
                          <option value="maintenance">En mantención</option>
                          <option value="storage">En bodega</option>
                          <option value="retired">Retirado</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Ubicación</label>
                      <input value={location} onChange={(e) => setLocation(e.target.value)}
                        placeholder="Sala servidores, Piso 2..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Asignado a</label>
                    <div className="relative">
                      <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-400">
                        <option value="">Sin asignar</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{u.name} {u.lastname}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Fechas */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <h2 className="text-sm font-semibold text-gray-700">Fechas y notas</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha de compra</label>
                      <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Garantía hasta</label>
                      <input type="date" value={warrantyEnd} onChange={(e) => setWarrantyEnd(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Notas</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                      placeholder="Observaciones adicionales..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
                  </div>
                </div>
              </>
            ) : (
              /* Infraestructura */
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="text-sm font-semibold text-gray-700">Datos del servidor / equipo de red</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Hostname *</label>
                    <input value={hostname} onChange={(e) => setHostname(e.target.value)} required
                      placeholder="srv-prod-01"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Dirección IP</label>
                    <input value={ip} onChange={(e) => setIp(e.target.value)}
                      placeholder="192.168.1.10"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Sistema operativo</label>
                  <input value={os} onChange={(e) => setOs(e.target.value)}
                    placeholder="Windows Server 2022, Ubuntu 22.04..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Entorno</label>
                    <div className="relative">
                      <select value={env} onChange={(e) => setEnv(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-400">
                        <option value="">Sin entorno</option>
                        {ENVS.map((e) => <option key={e} value={e} className="capitalize">{e}</option>)}
                      </select>
                      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Criticidad</label>
                    <div className="relative">
                      <select value={crit} onChange={(e) => setCrit(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-400">
                        <option value="">Sin clasificar</option>
                        {CRITS.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                      </select>
                      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Notas</label>
                  <textarea value={infraNotes} onChange={(e) => setInfraNotes(e.target.value)} rows={3}
                    placeholder="Rol del servidor, dependencias..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pb-6">
              <Link href="/inventario"
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg">
                Cancelar
              </Link>
              <button type="submit" disabled={loading}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white text-sm font-medium rounded-lg transition-colors">
                {loading ? "Guardando..." : "Registrar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
