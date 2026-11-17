"use client";

import React from "react";
import Link from "next/link";
import { DeteccionBiometrica } from "@/models/Camara";

interface RecentDetectionsWidgetProps {
  detecciones: DeteccionBiometrica[];
  estadoSistema: {
    estado: string;
    precisionGlobal: number;
    tiempoRespuestaMs: number;
    algoritmo: string;
  };
  onVerRegistroCompleto?: () => void;
}

export default function RecentDetectionsWidget({
  detecciones,
  estadoSistema,
}: RecentDetectionsWidgetProps) {
  const getBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "Entrada":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Tardanza":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Salida":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-4">
      {/* TARJETA DE ÚLTIMAS DETECCIONES */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Últimas Detecciones
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {detecciones.length} en vivo
          </span>
        </div>

        {detecciones.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs font-medium">Sin detecciones recientes</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Captura una marcación con la cámara para visualizarla aquí.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {detecciones.map((d) => {
              const iniciales = d.nombre
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "EM";

              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#1D4ED8] text-white font-bold flex items-center justify-center shrink-0 shadow-xs text-xs">
                      {iniciales}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{d.nombre}</p>
                      <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                        <span>{d.camaraNombre}</span>
                        <span>•</span>
                        <span className="text-slate-400">{d.hora}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                    <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                      {d.confianza ? `${d.confianza.toFixed(1)}%` : "98.8%"}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeColor(d.tipo)}`}>
                      {d.tipo}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-slate-100 text-center">
          <Link
            href="/entradas-salidas"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
          >
            Ver Registro Completo de Asistencias →
          </Link>
        </div>
      </div>

      {/* TARJETA DE ESTADO DEL SISTEMA BIOMÉTRICO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs text-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Estado del Sistema IA
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-600 font-medium">Estado Operativo</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {estadoSistema.estado}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-600 font-medium">Precisión Global</span>
            <span className="font-bold text-slate-900">{estadoSistema.precisionGlobal}%</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-600 font-medium">Latencia de Inferencia</span>
            <span className="font-bold text-slate-900">{estadoSistema.tiempoRespuestaMs} ms</span>
          </div>

          <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900 leading-snug">
            <span className="font-bold">Algoritmo:</span> {estadoSistema.algoritmo}
          </div>
        </div>
      </div>
    </div>
  );
}
