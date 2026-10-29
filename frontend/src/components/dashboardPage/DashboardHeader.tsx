"use client";

import React from "react";

interface DashboardHeaderProps {
  onRefresh: () => void;
  onExportCSV: () => void;
  loading: boolean;
}

export default function DashboardHeader({
  onRefresh,
  onExportCSV,
  loading,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-extrabold text-[#18243D] tracking-tight">
            Dashboard General
          </h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En vivo
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitoreo centralizado de asistencias, puntualidad y colaboradores en tiempo real.
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Actualizar datos desde la base de datos"
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer disabled:opacity-50"
        >
          <img
            src="/imgs/icons/refresh.svg"
            alt=""
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">Actualizar</span>
        </button>

        <button
          onClick={onExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#273656] hover:bg-[#1f2b45] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <img src="/imgs/icons/download.svg" alt="" className="w-3.5 h-3.5" />
          Exportar CSV
        </button>
      </div>
    </div>
  );
}
