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
            Supabase Live
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
          <svg
            className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          <span className="hidden sm:inline">Actualizar</span>
        </button>

        <button
          onClick={onExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#273656] hover:bg-[#1f2b45] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          Exportar CSV
        </button>
      </div>
    </div>
  );
}
