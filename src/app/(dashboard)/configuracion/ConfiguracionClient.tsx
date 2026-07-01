"use client";

import { useState } from "react";
import { Users, Tag, AlertTriangle, CircleDot, Shield } from "lucide-react";
import UsuariosTab from "./tabs/UsuariosTab";
import CategoriasTab from "./tabs/CategoriasTab";
import PrioridadesTab from "./tabs/PrioridadesTab";
import EstadosTab from "./tabs/EstadosTab";
import LdapTab from "./tabs/LdapTab";

const TABS = [
  { id: "usuarios",    label: "Usuarios",         icon: Users,         component: UsuariosTab },
  { id: "categorias",  label: "Categorías",        icon: Tag,           component: CategoriasTab },
  { id: "prioridades", label: "Prioridades",       icon: AlertTriangle, component: PrioridadesTab },
  { id: "estados",     label: "Estados",           icon: CircleDot,     component: EstadosTab },
  { id: "ldap",        label: "Active Directory",  icon: Shield,        component: LdapTab },
];

export default function ConfiguracionClient() {
  const [activeTab, setActiveTab] = useState("usuarios");
  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component ?? UsuariosTab;

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestión de usuarios y catálogos del sistema</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <ActiveComponent />
    </div>
  );
}
