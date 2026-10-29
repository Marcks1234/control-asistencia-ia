"use client";

import React, { useState, useMemo } from "react";
import { AttendanceRecord, FilterStatus } from "@/types/attendance";

interface DailyAttendanceCardProps {
  records?: AttendanceRecord[];
  externalSearch?: string;
  loading?: boolean;
}

const FILTERS: { id: FilterStatus; label: string; active: string; inactive: string }[] = [
  { id: "todos", label: "Todos", active: "bg-[#1E293B] text-white shadow-xs", inactive: "bg-gray-100 text-gray-600 hover:bg-gray-200" },
  { id: "presente", label: "Presentes", active: "bg-[#059669] text-white shadow-xs", inactive: "text-[#059669] bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#A7F3D0]/60" },
  { id: "ausente", label: "Ausentes", active: "bg-[#E11D48] text-white shadow-xs", inactive: "text-[#E11D48] bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3]/60" },
  { id: "tardanza", label: "Tardanzas", active: "bg-[#D97706] text-white shadow-xs", inactive: "text-[#D97706] bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FDE68A]/60" },
  { id: "permiso", label: "Permiso", active: "bg-[#2563EB] text-white shadow-xs", inactive: "text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE]/60" },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  presente: { label: "Presente", cls: "text-[#059669] bg-[#ECFDF5] border-[#A7F3D0]/60" },
  tardanza: { label: "Tardanza", cls: "text-[#D97706] bg-[#FFFBEB] border-[#FDE68A]/60" },
  ausente: { label: "Ausente", cls: "text-[#DC2626] bg-[#FFF1F2] border-[#FECDD3]/60" },
  permiso: { label: "Permiso", cls: "text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]/60" },
  esperado: { label: "Esperado", cls: "text-slate-600 bg-slate-100 border-slate-200" },
};

export default function DailyAttendanceCard({
  records = [],
  externalSearch = "",
  loading = false,
}: DailyAttendanceCardProps) {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("todos");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const counts = useMemo(() => ({
    todos: records.length,
    presente: records.filter((r) => r.status === "presente").length,
    ausente: records.filter((r) => r.status === "ausente").length,
    tardanza: records.filter((r) => r.status === "tardanza").length,
    permiso: records.filter((r) => r.status === "permiso").length,
    esperado: records.filter((r) => r.status === "esperado").length,
  }), [records]);

  const fechaCortaHoy = useMemo(() => {
    const ahora = new Date();
    return `${String(ahora.getDate()).padStart(2, "0")}/${String(ahora.getMonth() + 1).padStart(2, "0")}/${ahora.getFullYear()}`;
  }, []);

  const filteredRecords = useMemo(() => {
    const query = (searchTerm || externalSearch).toLowerCase().trim();
    return records.filter((rec) => {
      const matchesFilter = activeFilter === "todos" ? true : rec.status === activeFilter;
      const matchesSearch = !query || rec.name.toLowerCase().includes(query) || rec.department.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [records, activeFilter, searchTerm, externalSearch]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col space-y-4">
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#2563EB]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <h2 className="text-sm md:text-base font-bold text-gray-900">Registro del Día (Supabase)</h2>
          {loading && <span className="text-[11px] text-blue-600 animate-pulse font-medium">Sincronizando...</span>}
        </div>
        <span className="text-xs text-gray-400 font-medium" suppressHydrationWarning>
          {records.length} colaboradores · {fechaCortaHoy}
        </span>
      </div>

      {/* 2. Filter Pills Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id)}
            className={`px-3 py-1 rounded-full font-medium transition cursor-pointer shrink-0 ${
              activeFilter === f.id ? f.active : f.inactive
            }`}
          >
            {f.label} <span className="ml-1 font-semibold">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {/* 3. Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar empleado o departamento..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200/80 rounded-xl text-xs text-gray-700 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs transition"
        />
      </div>

      {/* 4. Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Empleado</th>
              <th className="py-2.5 px-3">Turno</th>
              <th className="py-2.5 px-3">Estado</th>
              <th className="py-2.5 px-3">Entrada</th>
              <th className="py-2.5 px-3">Salida</th>
              <th className="py-2.5 px-3">Horas</th>
              <th className="py-2.5 px-3">Nota</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && records.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                    </svg>
                    <span>Cargando datos desde Supabase...</span>
                  </div>
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400 text-xs">No se encontraron registros coincidentes.</td>
              </tr>
            ) : (
              filteredRecords.map((item) => {
                const badge = STATUS_BADGE[item.status] || STATUS_BADGE.esperado;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-900">{item.name}</div>
                      <div className="text-[11px] text-gray-400">{item.department}</div>
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      <div>{item.shift}</div>
                      <div className="text-[11px] text-gray-400">{item.shiftTime}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block text-[11px] font-semibold border px-2.5 py-0.5 rounded-full ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-700 font-medium">
                      {item.checkIn ? <span className="text-emerald-700 font-semibold">{item.checkIn}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 px-3 text-gray-700 font-medium">
                      {item.checkOut === "En curso" ? (
                        <span className="text-xs font-semibold text-amber-600">En curso</span>
                      ) : item.checkOut ? (
                        <span>{item.checkOut}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-gray-700 font-medium">
                      {item.hours || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 px-3">
                      {item.note ? (
                        <span className={`text-[11px] font-semibold ${
                          item.noteType === "danger" ? "text-red-600" : item.noteType === "warning" ? "text-amber-600" : "text-blue-600"
                        }`}>
                          {item.note}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
