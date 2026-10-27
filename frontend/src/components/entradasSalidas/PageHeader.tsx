import React from "react";

export default function PageHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Entrada / Salida
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Registro manual de asistencia · Lunes 07 de Septiembre 2026
        </p>
      </div>

      <div className="flex items-center gap-2 bg-[#EEF4FF] border border-[#D0E1FD] text-[#2563EB] rounded-full px-3.5 py-1 text-xs font-semibold w-fit self-start sm:self-auto">
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>Turno Mañana: 08:00 – 17:00</span>
      </div>
    </div>
  );
}

