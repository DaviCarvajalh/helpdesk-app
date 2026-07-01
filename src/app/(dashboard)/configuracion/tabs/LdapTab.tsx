"use client";

import { useEffect, useState } from "react";
import {
  Shield, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  Eye, EyeOff, Server, Users, Key,
} from "lucide-react";

interface LdapVars {
  LDAP_ENABLED:          string | null;
  LDAP_URL:              string | null;
  LDAP_DOMAIN:           string | null;
  LDAP_BASE_DN:          string | null;
  LDAP_BIND_DN:          string | null;
  LDAP_BIND_PASSWORD:    string | null;
  LDAP_GROUP_ADMIN:      string | null;
  LDAP_GROUP_SUPERVISOR: string | null;
  LDAP_GROUP_TECNICO:    string | null;
  LDAP_GROUP_AUDITOR:    string | null;
  LDAP_ROLE_DEFAULT:     string | null;
}

interface LdapStatus { vars: LdapVars; configured: boolean; enabled: boolean; }

function VarRow({ label, value, secret = false }: { label: string; value: string | null; secret?: boolean }) {
  const [show, setShow] = useState(false);
  const set = value !== null;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2">
        {set
          ? <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
          : <XCircle      size={13} className="text-gray-300 shrink-0" />}
        <code className="text-xs text-gray-600 font-mono">{label}</code>
      </div>
      <div className="flex items-center gap-1.5">
        {set ? (
          <>
            <span className="text-xs text-gray-500 font-mono max-w-[200px] truncate">
              {secret && !show ? "••••••••" : value}
            </span>
            {secret && (
              <button onClick={() => setShow(!show)} className="text-gray-400 hover:text-gray-600">
                {show ? <EyeOff size={11} /> : <Eye size={11} />}
              </button>
            )}
          </>
        ) : (
          <span className="text-xs text-gray-300 italic">no configurado</span>
        )}
      </div>
    </div>
  );
}

export default function LdapTab() {
  const [status,  setStatus]  = useState<LdapStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const [testUser,   setTestUser]   = useState("");
  const [testPwd,    setTestPwd]    = useState("");
  const [showPwd,    setShowPwd]    = useState(false);
  const [testing,    setTesting]    = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; user?: { account: string; mail: string; name: string; groups: number } } | null>(null);

  async function load() {
    setLoading(true); setError("");
    const res = await fetch("/api/admin/ldap");
    if (res.ok) setStatus(await res.json());
    else setError("Sin permisos o error al cargar");
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

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
  if (error)   return <div className="text-sm text-red-500 py-8 text-center">{error}</div>;
  if (!status) return null;

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Estado general */}
      <div className={`flex items-center gap-4 rounded-xl border p-5 ${
        status.enabled && status.configured
          ? "bg-emerald-50 border-emerald-200"
          : status.configured
          ? "bg-amber-50 border-amber-200"
          : "bg-gray-50 border-gray-200"
      }`}>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          status.enabled && status.configured ? "bg-emerald-100" : "bg-gray-100"
        }`}>
          <Shield size={20} className={status.enabled && status.configured ? "text-emerald-500" : "text-gray-400"} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {status.enabled && status.configured
              ? "Active Directory habilitado y configurado"
              : status.configured
              ? "Configurado pero deshabilitado (LDAP_ENABLED ≠ true)"
              : "Active Directory no configurado"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Las variables se configuran en el archivo <code className="font-mono">.env</code> del servidor
          </p>
        </div>
      </div>

      {/* Variables de conexión */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Server size={14} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Conexión al servidor</h2>
        </div>
        <VarRow label="LDAP_ENABLED"       value={status.vars.LDAP_ENABLED} />
        <VarRow label="LDAP_URL"           value={status.vars.LDAP_URL} />
        <VarRow label="LDAP_DOMAIN"        value={status.vars.LDAP_DOMAIN} />
        <VarRow label="LDAP_BASE_DN"       value={status.vars.LDAP_BASE_DN} />
        <VarRow label="LDAP_BIND_DN"       value={status.vars.LDAP_BIND_DN} />
        <VarRow label="LDAP_BIND_PASSWORD" value={status.vars.LDAP_BIND_PASSWORD} secret />
      </div>

      {/* Mapeo de grupos */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={14} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Mapeo de grupos AD → Roles</h2>
        </div>
        <div className="text-xs text-gray-400 mb-3">Nombre parcial del grupo de AD que se mapea a cada rol</div>
        <VarRow label="LDAP_GROUP_ADMIN"      value={status.vars.LDAP_GROUP_ADMIN} />
        <VarRow label="LDAP_GROUP_SUPERVISOR" value={status.vars.LDAP_GROUP_SUPERVISOR} />
        <VarRow label="LDAP_GROUP_TECNICO"    value={status.vars.LDAP_GROUP_TECNICO} />
        <VarRow label="LDAP_GROUP_AUDITOR"    value={status.vars.LDAP_GROUP_AUDITOR} />
        <VarRow label="LDAP_ROLE_DEFAULT"     value={status.vars.LDAP_ROLE_DEFAULT} />
      </div>

      {/* Test de conexión */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Key size={14} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Probar conexión</h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Ingresa credenciales de AD para verificar que la integración funciona correctamente
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Usuario AD</label>
            <input value={testUser} onChange={(e) => setTestUser(e.target.value)}
              placeholder="jperez o jperez@dominio.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Contraseña</label>
            <div className="relative">
              <input value={testPwd} onChange={(e) => setTestPwd(e.target.value)}
                type={showPwd ? "text" : "password"} placeholder="••••••••"
                className="w-full pr-8 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
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

      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-xs text-blue-700 space-y-2">
        <p className="font-semibold">Para configurar Active Directory:</p>
        <p>Edita el archivo <code className="font-mono bg-blue-100 px-1 rounded">.env</code> en el servidor y agrega:</p>
        <pre className="bg-blue-100 rounded-lg p-3 text-[11px] font-mono overflow-x-auto leading-relaxed">{`LDAP_ENABLED=true
LDAP_URL=ldap://dc.empresa.com:389
LDAP_DOMAIN=empresa.com
LDAP_BASE_DN=DC=empresa,DC=com
LDAP_BIND_DN=CN=svc-helpdesk,OU=Servicios,DC=empresa,DC=com
LDAP_BIND_PASSWORD=contraseña_servicio

# Nombres parciales de grupos AD (sin distinguishedName completo)
LDAP_GROUP_ADMIN=helpdesk-admin
LDAP_GROUP_SUPERVISOR=helpdesk-supervisor
LDAP_GROUP_TECNICO=helpdesk-tecnico
LDAP_GROUP_AUDITOR=helpdesk-auditor
LDAP_ROLE_DEFAULT=Usuario Final`}</pre>
        <p>Reinicia el servidor después de modificar <code className="font-mono bg-blue-100 px-1 rounded">.env</code>.</p>
      </div>

    </div>
  );
}
