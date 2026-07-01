"use client";

import { useEffect, useState } from "react";
import {
  Shield, CheckCircle2, AlertTriangle, RefreshCw,
  Eye, EyeOff, Server, Users, Key, Save, ToggleLeft, ToggleRight,
} from "lucide-react";

interface LdapForm {
  enabled:         boolean;
  url:             string;
  domain:          string;
  baseDn:          string;
  bindDn:          string;
  bindPassword:    string;
  hasPassword:     boolean;
  groupAdmin:      string;
  groupSupervisor: string;
  groupTecnico:    string;
  groupAuditor:    string;
  roleDefault:     string;
}

const EMPTY: LdapForm = {
  enabled: false, url: "", domain: "", baseDn: "", bindDn: "",
  bindPassword: "", hasPassword: false,
  groupAdmin: "", groupSupervisor: "", groupTecnico: "", groupAuditor: "",
  roleDefault: "Usuario Final",
};

function Field({ label, value, onChange, placeholder, type = "text", hint }:
  { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      {hint && <p className="text-[11px] text-gray-400 mb-1">{hint}</p>}
      <input value={value} onChange={(e) => onChange(e.target.value)}
        type={type} placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white" />
    </div>
  );
}

export default function LdapTab() {
  const [form,    setForm]    = useState<LdapForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const [testUser,   setTestUser]   = useState("");
  const [testPwd,    setTestPwd]    = useState("");
  const [showTpwd,   setShowTpwd]   = useState(false);
  const [testing,    setTesting]    = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; user?: { account: string; mail: string; name: string; groups: number } } | null>(null);

  const set = (k: keyof LdapForm) => (v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function load() {
    setLoading(true); setError("");
    const res = await fetch("/api/admin/ldap");
    if (res.ok) { const d = await res.json(); setForm({ ...EMPTY, ...d, bindPassword: "" }); }
    else setError("Sin permisos o error al cargar");
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true); setSaved(false); setError("");
    const res = await fetch("/api/admin/ldap", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); await load(); }
    else setError("Error al guardar");
    setSaving(false);
  }

  async function testConnection() {
    setTesting(true); setTestResult(null);
    const res = await fetch("/api/admin/ldap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testUser, testPassword: testPwd }),
    });
    setTestResult(await res.json());
    setTesting(false);
  }

  if (loading) return <div className="text-sm text-gray-400 py-8 text-center">Cargando...</div>;

  const configured = !!(form.url && form.baseDn && form.bindDn && (form.hasPassword || form.bindPassword));

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Estado */}
      <div className={`flex items-center justify-between gap-4 rounded-xl border p-5 ${
        form.enabled && configured ? "bg-emerald-50 border-emerald-200"
        : configured ? "bg-amber-50 border-amber-200"
        : "bg-gray-50 border-gray-200"
      }`}>
        <div className="flex items-center gap-3">
          <Shield size={18} className={form.enabled && configured ? "text-emerald-500" : "text-gray-400"} />
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {form.enabled && configured ? "Active Directory activo"
               : configured ? "Configurado pero deshabilitado"
               : "Sin configurar"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">La configuración se guarda en la base de datos</p>
          </div>
        </div>
        <button onClick={() => set("enabled")(!form.enabled)}
          className="flex items-center gap-1.5 text-sm font-medium">
          {form.enabled
            ? <><ToggleRight size={28} className="text-emerald-500" /><span className="text-emerald-600">Habilitado</span></>
            : <><ToggleLeft  size={28} className="text-gray-400" /><span className="text-gray-400">Deshabilitado</span></>}
        </button>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}

      {/* Conexión */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Server size={14} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Servidor LDAP</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label="URL del servidor" value={form.url} onChange={set("url")}
              placeholder="ldap://dc.empresa.com:389" hint="Usar ldaps:// para conexión segura" />
          </div>
          <Field label="Dominio" value={form.domain} onChange={set("domain")} placeholder="empresa.com" />
          <Field label="Base DN" value={form.baseDn} onChange={set("baseDn")} placeholder="DC=empresa,DC=com" />
          <div className="col-span-2">
            <Field label="Bind DN (cuenta de servicio)" value={form.bindDn} onChange={set("bindDn")}
              placeholder="CN=svc-helpdesk,OU=Servicios,DC=empresa,DC=com" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Contraseña de la cuenta de servicio
              {form.hasPassword && <span className="ml-2 text-emerald-600 font-normal">✓ guardada</span>}
            </label>
            <div className="relative">
              <input value={form.bindPassword} onChange={(e) => set("bindPassword")(e.target.value)}
                type={showPwd ? "text" : "password"}
                placeholder={form.hasPassword ? "Dejar vacío para mantener la actual" : "Contraseña"}
                className="w-full pr-9 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grupos */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-1">
          <Users size={14} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Mapeo de grupos AD → Roles</h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">Nombre parcial del grupo de AD (no es necesario el DN completo)</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Grupo Administrador" value={form.groupAdmin}      onChange={set("groupAdmin")}      placeholder="helpdesk-admin" />
          <Field label="Grupo Supervisor"    value={form.groupSupervisor} onChange={set("groupSupervisor")} placeholder="helpdesk-supervisor" />
          <Field label="Grupo Técnico"       value={form.groupTecnico}    onChange={set("groupTecnico")}    placeholder="helpdesk-tecnico" />
          <Field label="Grupo Auditor"       value={form.groupAuditor}    onChange={set("groupAuditor")}    placeholder="helpdesk-auditor" />
          <div className="col-span-2">
            <Field label="Rol por defecto (sin grupo)" value={form.roleDefault} onChange={set("roleDefault")} placeholder="Usuario Final" />
          </div>
        </div>
      </div>

      {/* Guardar */}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
          <Save size={14} className={saving ? "animate-pulse" : ""} />
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <CheckCircle2 size={14} /> Guardado correctamente
          </span>
        )}
      </div>

      {/* Test */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Key size={14} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Probar conexión</h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">Guarda primero y luego prueba con credenciales de un usuario AD real</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Usuario AD</label>
            <input value={testUser} onChange={(e) => setTestUser(e.target.value)}
              placeholder="jperez o jperez@empresa.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Contraseña</label>
            <div className="relative">
              <input value={testPwd} onChange={(e) => setTestPwd(e.target.value)}
                type={showTpwd ? "text" : "password"} placeholder="••••••••"
                className="w-full pr-9 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              <button type="button" onClick={() => setShowTpwd(!showTpwd)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                {showTpwd ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>
        </div>
        <button onClick={testConnection} disabled={testing || !testUser || !testPwd}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-sm rounded-lg transition-colors">
          <RefreshCw size={13} className={testing ? "animate-spin" : ""} />
          {testing ? "Probando..." : "Probar conexión"}
        </button>

        {testResult && (
          <div className={`mt-4 rounded-lg p-4 ${testResult.ok ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
            <div className="flex items-center gap-2 mb-1">
              {testResult.ok
                ? <CheckCircle2 size={14} className="text-emerald-500" />
                : <AlertTriangle size={14} className="text-red-500" />}
              <p className={`text-sm font-semibold ${testResult.ok ? "text-emerald-700" : "text-red-700"}`}>
                {testResult.message}
              </p>
            </div>
            {testResult.ok && testResult.user && (
              <div className="text-xs text-emerald-600 space-y-0.5 mt-2">
                <p>Usuario: <strong>{testResult.user.name}</strong> ({testResult.user.account})</p>
                <p>Email: {testResult.user.mail}</p>
                <p>Grupos AD: {testResult.user.groups}</p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
