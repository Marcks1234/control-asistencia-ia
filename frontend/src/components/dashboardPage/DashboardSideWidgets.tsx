"use client";

import React from "react";
import Link from "next/link";

interface DashboardSideWidgetsProps {
  totalEmpleados: number;
  porcentajeAsistencia: number;
  porcentajePuntualidad: number;
  totalMarcaciones: number;
}

export default function DashboardSideWidgets({
  totalEmpleados,
  porcentajeAsistencia,
  porcentajePuntualidad,
  totalMarcaciones,
}: DashboardSideWidgetsProps) {
  return (
    <div className="space-y-5">
      {/* Turno Actual de Operación */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Jornada Operativa
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-bold">
            ACTIVO
          </span>
        </div>

        <h3 className="text-base font-bold text-[#18243D]">
          Turno Central Mañana
        </h3>

        <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          08:00 AM — 05:00 PM · {totalEmpleados} colaboradores asignados
        </p>

        <div className="mt-4">
          <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
            <span>Avance de asistencia</span>
            <span className="text-blue-600">{porcentajeAsistencia}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(porcentajeAsistencia, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Índice de Puntualidad */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Índice de Puntualidad
        </span>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-[#18243D]">
            {porcentajePuntualidad}%
          </span>
          <span className="text-xs font-semibold text-emerald-600">
            cumplimiento
          </span>
        </div>

        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
          Basado en {totalMarcaciones} colaboradores con registro de entrada durante el día de hoy.
        </p>
      </div>

      {/* Acceso Rápido a Otros Módulos */}
      <div className="bg-gradient-to-br from-[#273656] to-[#1a253b] text-white rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-wide uppercase">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
            />
          </svg>
          Gestión Inteligente
        </div>

        <h4 className="mt-2 text-sm font-bold">
          ¿Deseas marcar una asistencia o consultar a la IA?
        </h4>
        <p className="mt-1 text-xs text-slate-300">
          Puedes registrar ingresos manuales o pedir reportes instantáneos con lenguaje natural.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <Link
            href="/entradas-salidas"
            className="inline-flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold transition cursor-pointer"
          >
            <span>Ir a Entradas / Salidas</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
            </svg>
          </Link>

          <Link
            href="/asistente-ia"
            className="inline-flex items-center justify-between px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold transition cursor-pointer"
          >
            <span>Abrir Asistente IA</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
