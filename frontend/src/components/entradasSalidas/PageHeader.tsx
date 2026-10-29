"use client";

import React, { useEffect, useState } from "react";

function obtenerFechaSubtitulo(): string {
  const f = new Date().toLocaleDateString("es-PE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  return f.charAt(0).toUpperCase() + f.slice(1);
}

export default function PageHeader() {
  const [fechaTexto, setFechaTexto] = useState<string>(obtenerFechaSubtitulo);

  useEffect(() => {
    setFechaTexto(obtenerFechaSubtitulo());
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Entrada / Salida</h1>
        <p className="text-xs text-slate-500 mt-1" suppressHydrationWarning>
          Registro manual de asistencia · {fechaTexto}
        </p>
      </div>

      <div className="flex items-center gap-2 bg-[#EEF4FF] border border-[#D0E1FD] text-[#2563EB] rounded-full px-3.5 py-1.5 text-xs font-semibold w-fit">
        <span>Turno Mañana: 08:00 – 17:00</span>
      </div>
    </div>
  );
}
