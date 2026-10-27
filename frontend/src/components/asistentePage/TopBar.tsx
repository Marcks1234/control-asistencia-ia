"use client";

import { useEffect, useState } from "react";

interface TopBarProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onQuickAsk?: (pregunta: string) => void;
}

function obtenerFechaActualFormateada(): string {
  const ahora = new Date();
  const dias = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const nombreDia = dias[ahora.getDay()];
  const diaNumero = String(ahora.getDate()).padStart(2, "0");
  const nombreMes = meses[ahora.getMonth()];
  const anio = ahora.getFullYear();

  return `${nombreDia}, ${diaNumero} de ${nombreMes} ${anio}`;
}

export default function TopBar({
  searchQuery = "",
  onSearchChange,
  onQuickAsk,
}: TopBarProps) {
  const [fechaHoy, setFechaHoy] = useState<string>(obtenerFechaActualFormateada);

  useEffect(() => {
    setFechaHoy(obtenerFechaActualFormateada());
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim() && onQuickAsk) {
      onQuickAsk(`Consultar información de: ${searchQuery.trim()}`);
      if (onSearchChange) onSearchChange("");
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/80 px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        {/* Pill de Fecha Actual Dinámica */}
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100/80 border border-slate-200/60 text-xs font-semibold text-slate-700 shrink-0">
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <span suppressHydrationWarning>{fechaHoy}</span>
        </div>

        {/* Buscador superior */}
        <div className="relative flex-1 max-w-md">
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Buscar empleado, DNI o evento..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100/70 border border-transparent focus:border-blue-500/40 focus:bg-white text-xs text-slate-700 placeholder:text-slate-400 focus:outline-hidden transition"
          />
        </div>
      </div>

      {/* Botón derecho Asistente AI */}
      <button
        type="button"
        onClick={() => onQuickAsk?.("Generar resumen del día")}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B57D0] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
          />
        </svg>
        <span>Asistente AI</span>
      </button>
    </header>
  );
}

