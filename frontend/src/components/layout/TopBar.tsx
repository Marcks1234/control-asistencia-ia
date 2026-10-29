"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { obtenerFechaHoy } from "@/lib/dateUtils";

interface TopBarProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onQuickAsk?: (pregunta: string) => void;
}

export default function TopBar({ searchQuery = "", onSearchChange, onQuickAsk }: TopBarProps) {
  const [fechaHoy, setFechaHoy] = useState<string>(obtenerFechaHoy);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setFechaHoy(obtenerFechaHoy());
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim() && onQuickAsk) {
      onQuickAsk(`Consultar información de: ${searchQuery.trim()}`);
      onSearchChange?.("");
    }
  };

  const handleAiButtonClick = () => {
    if (onQuickAsk && pathname === "/asistente-ia") {
      onQuickAsk("Generar resumen del día");
    } else {
      router.push("/asistente-ia");
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100/80 border border-slate-200/60 text-xs font-semibold text-slate-700 shrink-0">
          <span suppressHydrationWarning>{fechaHoy}</span>
        </div>

        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Buscar empleado, DNI o evento..."
            className="w-full px-4 py-2 rounded-xl bg-slate-100/70 border border-transparent focus:border-blue-500/40 focus:bg-white text-xs text-slate-700 placeholder:text-slate-400 focus:outline-hidden transition"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleAiButtonClick}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B57D0] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
      >
        <span>Asistente AI</span>
      </button>
    </header>
  );
}
