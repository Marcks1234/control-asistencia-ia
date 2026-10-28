"use client";

import React from "react";

interface DashboardStatsGridProps {
  totalEmpleados: number;
  presentesHoy: number;
  tardanzasHoy: number;
  ausentesHoy: number;
  porcentajeAsistencia: number;
  loading: boolean;
}

export default function DashboardStatsGrid({
  totalEmpleados,
  presentesHoy,
  tardanzasHoy,
  ausentesHoy,
  porcentajeAsistencia,
  loading,
}: DashboardStatsGridProps) {
  const stats = [
    { label: "Colaboradores", value: totalEmpleados, desc: "Total activos en planilla", color: "text-[#18243D]", bg: "bg-blue-50 text-blue-600" },
    { label: "Presentes Hoy", value: presentesHoy, desc: `${porcentajeAsistencia}% asistencia`, color: "text-emerald-600", bg: "bg-emerald-50 text-emerald-600" },
    { label: "Tardanzas Hoy", value: tardanzasHoy, desc: "Con tolerancia calculada", color: "text-amber-600", bg: "bg-amber-50 text-amber-600" },
    { label: "Sin Entrada Hoy", value: ausentesHoy, desc: "Faltas o pendientes", color: "text-rose-600", bg: "bg-rose-50 text-rose-600" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{s.label}</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${s.bg}`}>
              •
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-3xl font-extrabold ${s.color}`}>
              {loading ? "..." : s.value}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{s.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
