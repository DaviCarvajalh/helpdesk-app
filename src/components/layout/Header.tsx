"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell, ChevronDown, Search, LogOut, User,
  AlertTriangle, XCircle, FileText, Shield, Inbox, Menu,
} from "lucide-react";
import { useMobileMenu } from "@/context/MobileMenuContext";

interface NotifItem {
  type: string; label: string; sub: string; href: string; level: "error" | "warn";
}
interface Me { name: string; role: string; }

const LEVEL_STYLE = {
  error: { icon: XCircle,       color: "text-red-500",    bg: "bg-red-50"    },
  warn:  { icon: AlertTriangle, color: "text-amber-500",  bg: "bg-amber-50"  },
};

const TYPE_ICON: Record<string, React.ElementType> = {
  sla:         XCircle,
  unassigned:  Inbox,
  contract:    FileText,
  credentials: Shield,
};

export default function Header() {
  const router = useRouter();
  const { toggle } = useMobileMenu();

  const [me,        setMe]        = useState<Me | null>(null);
  const [notifs,    setNotifs]    = useState<NotifItem[]>([]);
  const [showBell,  setShowBell]  = useState(false);
  const [showUser,  setShowUser]  = useState(false);

  const bellRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then((d) => d && setMe(d));
    fetch("/api/notificaciones").then((r) => r.ok ? r.json() : null).then((d) => d && setNotifs(d.items ?? []));
  }, []);

  // Cerrar dropdowns al click fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setShowBell(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const initial = me?.name?.charAt(0).toUpperCase() ?? "U";
  const errorCount = notifs.filter((n) => n.level === "error").length;
  const total = notifs.length;

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between shrink-0 z-30">
      {/* Hamburger — solo móvil */}
      <button onClick={toggle}
        className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors mr-2">
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
        <input type="text" placeholder="Buscar tickets, artículos..."
          className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 w-64" />
      </div>

      <div className="flex items-center gap-3 ml-auto">

        {/* Bell */}
        <div ref={bellRef} className="relative">
          <button onClick={() => { setShowBell(!showBell); setShowUser(false); }}
            className="relative text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100">
            <Bell size={20} />
            {total > 0 && (
              <span className={`absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center text-[9px] font-bold text-white rounded-full ${
                errorCount > 0 ? "bg-red-500" : "bg-amber-500"
              }`}>
                {total > 9 ? "9+" : total}
              </span>
            )}
          </button>

          {showBell && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Notificaciones</p>
                {total > 0 && (
                  <span className="text-xs text-gray-400">{total} alertas</span>
                )}
              </div>
              {notifs.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  Sin notificaciones pendientes
                </div>
              ) : (
                <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {notifs.map((n, i) => {
                    const st  = LEVEL_STYLE[n.level];
                    const Ico = TYPE_ICON[n.type] ?? Bell;
                    return (
                      <li key={i}>
                        <Link href={n.href} onClick={() => setShowBell(false)}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${st.bg}`}>
                            <Ico size={13} className={st.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700 line-clamp-1">{n.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{n.sub}</p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="px-4 py-2.5 border-t border-gray-100">
                <Link href="/reportes" onClick={() => setShowBell(false)}
                  className="text-xs text-emerald-600 hover:underline font-medium">
                  Ver reportes completos →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={userRef} className="relative">
          <button onClick={() => { setShowUser(!showUser); setShowBell(false); }}
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors pl-2 pr-1 py-1.5 rounded-lg hover:bg-gray-100">
            <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initial}
            </div>
            <span className="hidden sm:block">{me?.name ?? "…"}</span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {showUser && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
              {/* Info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">{me?.name ?? "Usuario"}</p>
                <p className="text-xs text-gray-400 capitalize mt-0.5">{me?.role ?? ""}</p>
              </div>
              {/* Options */}
              <ul className="py-1">
                <li>
                  <Link href="/configuracion" onClick={() => setShowUser(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <User size={14} className="text-gray-400" /> Mi perfil
                  </Link>
                </li>
                <li>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut size={14} /> Cerrar sesión
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
