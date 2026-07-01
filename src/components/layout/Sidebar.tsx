"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  ClipboardList,
  Monitor,
  BookOpen,
  Settings,
  MessageCircle,
  LogOut,
  ShieldCheck,
  FileText,
  BarChart3,
  X,
} from "lucide-react";
import { useMobileMenu } from "@/context/MobileMenuContext";

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "text-emerald-400",
  },
  {
    label: "Tickets",
    href: "/tickets",
    icon: Ticket,
    color: "text-orange-400",
  },
  {
    label: "Procedimientos",
    href: "/procedimientos",
    icon: ClipboardList,
    color: "text-blue-400",
  },
  {
    label: "Inventario",
    href: "/inventario",
    icon: Monitor,
    color: "text-sky-400",
  },
  {
    label: "Credenciales",
    href: "/credenciales",
    icon: ShieldCheck,
    color: "text-yellow-400",
  },
  {
    label: "Contratos",
    href: "/contratos",
    icon: FileText,
    color: "text-purple-400",
  },
  {
    label: "Conocimiento",
    href: "/conocimiento",
    icon: BookOpen,
    color: "text-teal-400",
  },
  {
    label: "Reportes",
    href: "/reportes",
    icon: BarChart3,
    color: "text-pink-400",
  },
  {
    label: "Configuración",
    href: "/configuracion",
    icon: Settings,
    color: "text-gray-400",
  },
];

interface SidebarProps {
  userName?: string;
  userRole?: string;
  userInitial?: string;
}

export default function Sidebar({ userName = "Usuario", userRole = "Técnico", userInitial = "U" }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { open, close } = useMobileMenu();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const handleNav = () => close();

  return (
    <>
      {/* Backdrop móvil */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={close}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-40 w-56 bg-[#1a2035] flex flex-col shrink-0
        transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:w-52 md:min-h-screen
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
              <MessageCircle className="text-white" size={16} strokeWidth={1.5} />
            </div>
            <span className="text-base font-bold tracking-tight">
              <span className="text-white">Help</span>
              <span className="text-emerald-400">Desk</span>
            </span>
          </div>
          {/* Cerrar en móvil */}
          <button onClick={close} className="md:hidden text-gray-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
          {menuItems.map(({ label, href, icon: Icon, color }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={handleNav}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border-l-[3px] ${
                  isActive
                    ? "bg-emerald-500/10 text-white border-emerald-400"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200 border-transparent"
                }`}
              >
                <Icon size={17} className={isActive ? "text-emerald-400" : color} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 text-white text-xs font-bold">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-white font-medium leading-tight truncate">{userName}</p>
              <p className="text-[11px] text-gray-400 leading-tight">{userRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-400 transition-colors shrink-0 ml-2"
            title="Cerrar sesión"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>
    </>
  );
}
