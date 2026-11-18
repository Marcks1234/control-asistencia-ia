"use client";

import React, { useEffect, useState } from "react";
import ModuleHeader from "@/components/ui/ModuleHeader";

function obtenerFechaSubtitulo(): string {
  const f = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return f.charAt(0).toUpperCase() + f.slice(1);
}

export default function PageHeader() {
  const [fechaTexto, setFechaTexto] = useState<string>(obtenerFechaSubtitulo);

  useEffect(() => {
    setFechaTexto(obtenerFechaSubtitulo());
  }, []);

  return (
    <ModuleHeader
      title="Entradas y Salidas"
      subtitle={`Registro manual de asistencia · ${fechaTexto}`}
      actions={
        <div className="flex items-center gap-2 bg-[#EEF4FF] border border-[#D0E1FD] text-[#2563EB] rounded-full px-3.5 py-1.5 text-xs font-semibold w-fit">
          <span>Turno Mañana: 08:00 – 17:00</span>
        </div>
      }
    />
  );
}
