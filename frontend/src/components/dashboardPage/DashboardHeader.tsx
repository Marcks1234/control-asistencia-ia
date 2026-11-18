"use client";

import React from "react";
import ModuleHeader from "@/components/ui/ModuleHeader";

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
    <ModuleHeader
      title="Dashboard General"
      subtitle="Resumen de asistencias, puntualidad y colaboradores del día."
      badge={{ text: "En vivo", tone: "emerald", pulse: true }}
      actions={
        <>
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Actualizar datos"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer disabled:opacity-50"
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#273656] hover:bg-[#1f2b45] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <img src="/imgs/icons/download.svg" alt="" className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </>
      }
    />
  );
}
