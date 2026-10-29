"use client";

import React, { useEffect, useState } from "react";

function obtenerFechaSubtitulo(): string {
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
  return `${dias[ahora.getDay()]} ${String(ahora.getDate()).padStart(2, "0")} de ${meses[ahora.getMonth()]} ${ahora.getFullYear()}`;
}

export default function PageHeader() {
  const [fechaTexto, setFechaTexto] = useState<string>(obtenerFechaSubtitulo);

  useEffect(() => {
    setFechaTexto(obtenerFechaSubtitulo());
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Entrada / Salida
        </h1>
        <p className="text-xs text-slate-500 mt-1" suppressHydrationWarning>
          Registro manual de asistencia · {fechaTexto}
        </p>
      </div>

      <div className="flex items-center gap-2 bg-[#EEF4FF] border border-[#D0E1FD] text-[#2563EB] rounded-full px-3.5 py-1.5 text-xs font-semibold w-fit">
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
