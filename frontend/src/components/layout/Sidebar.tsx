"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface SidebarProps {
  activeItem?: string;
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", habilitado: true },
  { id: "personal", label: "Personal", href: "/entradas-salidas", habilitado: false },
  { id: "camaras-ia", label: "Cámaras IA", href: "/entradas-salidas", habilitado: false },
  { id: "entradas-salidas", label: "Entradas / Salidas", href: "/entradas-salidas", habilitado: true },
  { id: "reportes", label: "Reportes", href: "/entradas-salidas", habilitado: false },
  { id: "asistente-ia", label: "Asistente IA", href: "/asistente-ia", habilitado: true },
];

export default function Sidebar({ activeItem }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [usuario, setUsuario] = useState({
    nombre: "",
    apellido: "",
    rol: "Gerente RRHH",
  });

  useEffect(() => {
    const guardado = localStorage.getItem("asistencia_usuario");
    if (guardado) {
      try {
        const p = JSON.parse(guardado);
        if (p?.nombre) {
          setUsuario({
            nombre: p.nombre,
            apellido: p.apellido || "",
            rol: p.rol === "GERENTE" ? "Gerente RRHH" : p.rol || "Gerente RRHH",
          });
        }
      } catch {}
    }
  }, []);

  const manejarCerrarSesion = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    localStorage.removeItem("asistencia_jwt");
    localStorage.removeItem("asistencia_usuario");
    router.push("/#login");
  };

  const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`.trim() || "Usuario";
  const iniciales = `${usuario.nombre?.[0] || "U"}${usuario.apellido?.[0] || ""}`.toUpperCase();

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200/80 flex flex-col justify-between min-h-screen select-none">
      <div>
        {/* Cabecera de marca */}
        <Link href="/" className="px-5 pt-6 pb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1D4ED8] flex items-center justify-center text-white shadow-sm font-black text-sm">
            AI
          </div>
          <div className="leading-tight">
            <div className="font-extrabold text-[15px] tracking-tight text-slate-900">
              Asistencia<span className="text-[#1D4ED8]">AI</span>
            </div>
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mt-0.5">
              Control &amp; Asistencia
            </div>
          </div>
        </Link>

        <div className="px-5 pt-2 pb-2">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Navegación Principal
          </span>
        </div>

        <nav className="px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.habilitado &&
              (activeItem === item.id || pathname === item.href || pathname?.startsWith(`${item.href}/`));

            if (!item.habilitado) {
              return (
                <button
                  key={item.id}
                  type="button"
                  title="Módulo previsto para el siguiente entregable"
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-slate-400 hover:bg-slate-50 transition-all text-left cursor-pointer"
                >
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-[#0B1120] text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Perfil y Salir */}
      <div className="p-3 border-t border-slate-100 space-y-1">
        <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0" suppressHydrationWarning>
              {iniciales}
            </div>
            <div className="leading-tight">
              <div className="text-xs font-bold text-slate-800" suppressHydrationWarning>{nombreCompleto}</div>
              <div className="text-[11px] text-slate-400" suppressHydrationWarning>{usuario.rol}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={manejarCerrarSesion}
            title="Cerrar sesión"
            className="text-xs text-slate-400 hover:text-red-600 px-2 py-1 rounded-md hover:bg-slate-200/50 transition cursor-pointer font-medium"
          >
            Salir
          </button>
        </div>
      </div>
    </aside>
  );
}
