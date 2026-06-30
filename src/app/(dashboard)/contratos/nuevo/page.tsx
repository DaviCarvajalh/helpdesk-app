"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { ArrowLeft, AlertTriangle, ChevronDown, Plus } from "lucide-react";

interface Customer { id: string; name: string; taxId?: string | null; }

export default function NuevoContratoPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const tipo         = searchParams.get("tipo") === "cliente" ? "cliente" : "contrato";

  const [customers,   setCustomers]   = useState<Customer[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  // Contrato fields
  const [customerId,     setCustomerId]     = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [startDate,      setStartDate]      = useState("");
  const [endDate,        setEndDate]        = useState("");
  const [amount,         setAmount]         = useState("");
  const [status,         setStatus]         = useState("active");
  const [notes,          setNotes]          = useState("");

  // Cliente fields
  const [cName,  setCName]  = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cTaxId, setCTaxId] = useState("");

  // Inline new customer toggle
  const [newCustomer, setNewCustomer] = useState(false);

  useEffect(() => {
    fetch("/api/contratos/clientes")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (tipo === "cliente") {
        if (!cName) { setError("Nombre es obligatorio"); setLoading(false); return; }
        const res = await fetch("/api/contratos/clientes", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: cName, email: cEmail || undefined, phone: cPhone || undefined, taxId: cTaxId || undefined }),
        });
        const d = await res.json();
        if (!res.ok) { setError(d.message ?? "Error al crear"); return; }
        router.push("/contratos");
        return;
      }

      // Contrato — puede crear cliente inline primero
      let resolvedCustomerId = customerId;
      if (newCustomer) {
        if (!cName) { setError("Nombre del cliente es obligatorio"); setLoading(false); return; }
        const res = await fetch("/api/contratos/clientes", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: cName, email: cEmail || undefined, phone: cPhone || undefined, taxId: cTaxId || undefined }),
        });
        const d = await res.json();
        if (!res.ok) { setError(d.message ?? "Error al crear cliente"); return; }
        resolvedCustomerId = d.customer.id;
      }

      if (!resolvedCustomerId) { setError("Selecciona o crea un cliente"); setLoading(false); return; }
      if (!contractNumber || !startDate || !endDate) { setError("N° contrato y fechas son obligatorios"); setLoading(false); return; }

      const res = await fetch("/api/contratos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: resolvedCustomerId,
          contractNumber, startDate, endDate,
          amount: amount ? parseFloat(amount) : undefined,
          status, notes: notes || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.message ?? "Error al crear"); return; }
      router.push(`/contratos/${d.contract.id}`);
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-6">

          <Link href="/contratos"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5">
            <ArrowLeft size={14} /> Volver a contratos
          </Link>

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-800">
              {tipo === "contrato" ? "Nuevo Contrato" : "Nuevo Cliente"}
            </h1>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(["contrato", "cliente"] as const).map((t) => (
                <Link key={t} href={`/contratos/nuevo${t === "cliente" ? "?tipo=cliente" : ""}`}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    tipo === t ? "bg-white shadow-sm text-gray-800" : "text-gray-500"
                  }`}>
                  {t === "contrato" ? "Contrato" : "Cliente"}
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
            {tipo === "contrato" ? (
              <>
                {/* Cliente */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-700">Cliente</h2>
                    <button type="button" onClick={() => setNewCustomer(!newCustomer)}
                      className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-medium">
                      <Plus size={12} /> {newCustomer ? "Seleccionar existente" : "Crear nuevo"}
                    </button>
                  </div>

                  {newCustomer ? (
                    <div className="space-y-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <p className="text-xs text-purple-600 font-medium">Nuevo cliente</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                          <input value={cName} onChange={(e) => setCName(e.target.value)}
                            placeholder="Empresa S.A."
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">RUT / Tax ID</label>
                          <input value={cTaxId} onChange={(e) => setCTaxId(e.target.value)}
                            placeholder="76.000.000-0"
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                          <input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)}
                            placeholder="contacto@empresa.cl"
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                          <input value={cPhone} onChange={(e) => setCPhone(e.target.value)}
                            placeholder="+56 9 1234 5678"
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required={!newCustomer}
                        className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-purple-400">
                        <option value="">Seleccionar cliente...</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}{c.taxId ? ` — ${c.taxId}` : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  )}
                </div>

                {/* Datos del contrato */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <h2 className="text-sm font-semibold text-gray-700">Datos del contrato</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">N° Contrato *</label>
                      <input value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} required
                        placeholder="CTR-2026-001"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Inicio *</label>
                      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Vencimiento *</label>
                      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Monto (CLP)</label>
                      <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Estado</label>
                      <div className="relative">
                        <select value={status} onChange={(e) => setStatus(e.target.value)}
                          className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-purple-400">
                          <option value="active">Activo</option>
                          <option value="draft">Borrador</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Notas</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                      placeholder="Observaciones, alcance del contrato..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
                  </div>
                </div>
              </>
            ) : (
              /* Formulario Cliente */
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="text-sm font-semibold text-gray-700">Datos del cliente</h2>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre / Razón social *</label>
                  <input value={cName} onChange={(e) => setCName(e.target.value)} required
                    placeholder="Empresa S.A."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">RUT / Tax ID</label>
                    <input value={cTaxId} onChange={(e) => setCTaxId(e.target.value)}
                      placeholder="76.000.000-0"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                    <input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)}
                      placeholder="contacto@empresa.cl"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Teléfono</label>
                    <input value={cPhone} onChange={(e) => setCPhone(e.target.value)}
                      placeholder="+56 9 1234 5678"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pb-6">
              <Link href="/contratos"
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg">
                Cancelar
              </Link>
              <button type="submit" disabled={loading}
                className="px-6 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white text-sm font-medium rounded-lg transition-colors">
                {loading ? "Guardando..." : tipo === "contrato" ? "Crear Contrato" : "Crear Cliente"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
