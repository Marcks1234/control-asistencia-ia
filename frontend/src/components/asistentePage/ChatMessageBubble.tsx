"use client";

import React from "react";
import { InteraccionChat } from "@/types/asistente";
import { AuthUserInfo } from "@/hooks/useAuthUser";
import TarjetaEmpleadoTardanza from "./TarjetaEmpleadoTardanza";

interface ChatMessageBubbleProps {
  item: InteraccionChat;
  hora: string;
  usuario: AuthUserInfo;
  onJustificado: () => void;
  sparkleIcon: React.ReactNode;
}

export default function ChatMessageBubble({
  item,
  hora,
  usuario,
  onJustificado,
  sparkleIcon,
}: ChatMessageBubbleProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] text-slate-400" suppressHydrationWarning>
            {hora}
          </span>
          <span className="text-xs font-bold text-slate-800" suppressHydrationWarning>
            {usuario.nombreCompleto}
          </span>
          <div
            className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center"
            suppressHydrationWarning
          >
            {usuario.iniciales}
          </div>
        </div>
        <div className="bg-[#1D63ED] text-white text-xs font-medium px-4 py-3 rounded-2xl rounded-tr-sm max-w-md shadow-xs whitespace-pre-wrap leading-relaxed">
          {item.mensaje}
        </div>
      </div>

      {item.respuesta && (
        <div className="flex items-start gap-3.5">
          {sparkleIcon}
          <div className="space-y-2.5 max-w-2xl flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Asistente</span>
              <span className="text-[11px] text-slate-400" suppressHydrationWarning>
                {hora}
              </span>
            </div>
            <div className="bg-slate-100/80 border border-slate-200/50 rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {item.respuesta}
            </div>
            {(() => {
              const lista =
                item.metadata?.empleados && item.metadata.empleados.length > 0
                  ? item.metadata.empleados
                  : item.metadata?.empleado
                  ? [item.metadata.empleado]
                  : [];
              if (lista.length === 0) return null;
              return (
                <div className="space-y-3 pt-1">
                  {lista.map((emp) => (
                    <TarjetaEmpleadoTardanza
                      key={emp.id}
                      empleado={emp}
                      onJustificado={onJustificado}
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

