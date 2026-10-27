"use client";

import React, { useState, useMemo } from "react";
import { AttendanceRecord, FilterStatus } from "@/types/attendance";
import { INITIAL_ATTENDANCE_RECORDS } from "@/services/mockAttendanceData";

interface DailyAttendanceCardProps {
  records?: AttendanceRecord[];
  externalSearch?: string;
  loading?: boolean;
}

export default function DailyAttendanceCard({
  records = INITIAL_ATTENDANCE_RECORDS,
  externalSearch = "",
  loading = false,
}: DailyAttendanceCardProps) {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("todos");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Conteos reales y coherentes con Asistente IA y la base de datos
  const counts = useMemo(() => {
    return {
      todos: records.length,
      presente: records.filter((r) => r.status === "presente").length,
      ausente: records.filter((r) => r.status === "ausente").length,
      tardanza: records.filter((r) => r.status === "tardanza").length,
      permiso: records.filter((r) => r.status === "permiso").length,
      esperado: records.filter((r) => r.status === "esperado").length,
    };
  }, [records]);

  const fechaCortaHoy = useMemo(() => {
    const ahora = new Date();
    const d = String(ahora.getDate()).padStart(2, "0");
    const m = String(ahora.getMonth() + 1).padStart(2, "0");
    const y = ahora.getFullYear();
    return `${d}/${m}/${y}`;
  }, []);

  // Filtered rows
  const filteredRecords = useMemo(() => {
    const query = (searchTerm || externalSearch).toLowerCase().trim();
    return records.filter((rec) => {
      const matchesFilter =
        activeFilter === "todos" ? true : rec.status === activeFilter;
      const matchesSearch =
        !query ||
        rec.name.toLowerCase().includes(query) ||
        rec.department.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [records, activeFilter, searchTerm, externalSearch]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col space-y-4">
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-[#2563EB]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <h2 className="text-sm md:text-base font-bold text-gray-900">
            Registro del Día (Supabase)
          </h2>
          {loading && (
            <span className="text-[11px] text-blue-600 animate-pulse font-medium">
              Sincronizando...
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 font-medium" suppressHydrationWarning>
          {records.length} colaboradores · {fechaCortaHoy}
        </span>
      </div>

      {/* 2. Filter Pills Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        {/* Todos */}
        <button
          type="button"
          onClick={() => setActiveFilter("todos")}
          className={`px-3 py-1 rounded-full font-medium transition cursor-pointer shrink-0 ${
            activeFilter === "todos"
              ? "bg-[#1E293B] text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Todos <span className="ml-1 font-semibold">{counts.todos}</span>
        </button>

        {/* Presentes */}
        <button
          type="button"
          onClick={() => setActiveFilter("presente")}
          className={`px-3 py-1 rounded-full font-medium transition cursor-pointer shrink-0 ${
            activeFilter === "presente"
              ? "bg-[#059669] text-white shadow-xs"
              : "text-[#059669] bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#A7F3D0]/60"
          }`}
        >
          Presentes <span className="ml-1 font-semibold">{counts.presente}</span>
        </button>

        {/* Ausentes */}
        <button
          type="button"
          onClick={() => setActiveFilter("ausente")}
          className={`px-3 py-1 rounded-full font-medium transition cursor-pointer shrink-0 ${
            activeFilter === "ausente"
              ? "bg-[#E11D48] text-white shadow-xs"
              : "text-[#E11D48] bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3]/60"
          }`}
        >
          Ausentes <span className="ml-1 font-semibold">{counts.ausente}</span>
        </button>

        {/* Tardanzas */}
        <button
          type="button"
          onClick={() => setActiveFilter("tardanza")}
          className={`px-3 py-1 rounded-full font-medium transition cursor-pointer shrink-0 ${
            activeFilter === "tardanza"
              ? "bg-[#D97706] text-white shadow-xs"
              : "text-[#D97706] bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FDE68A]/60"
          }`}
        >
          Tardanzas <span className="ml-1 font-semibold">{counts.tardanza}</span>
        </button>

        {/* Permiso */}
        <button
          type="button"
          onClick={() => setActiveFilter("permiso")}
          className={`px-3 py-1 rounded-full font-medium transition cursor-pointer shrink-0 ${
            activeFilter === "permiso"
              ? "bg-[#2563EB] text-white shadow-xs"
              : "text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE]/60"
          }`}
        >
          Permiso <span className="ml-1 font-semibold">{counts.permiso}</span>
        </button>
      </div>

      {/* 3. Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar empleado o departamento..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200/80 rounded-xl text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs transition"
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
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  No se encontraron registros de asistencia.
                </td>
              </tr>
            ) : (
              filteredRecords.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {/* Empleado */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-gray-900 leading-snug">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {item.department}
                    </div>
                  </td>

                  {/* Turno */}
                  <td className="py-3 px-3 text-gray-600 font-medium">
                    <div>{item.shift}</div>
                    <div className="text-[11px] text-gray-400">{item.shiftTime}</div>
                  </td>

                  {/* Estado */}
                  <td className="py-3 px-3">
                    {item.status === "presente" && (
                      <span className="inline-block text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0]/60 px-2.5 py-0.5 rounded-full">
                        Presente
                      </span>
                    )}
                    {item.status === "tardanza" && (
                      <span className="inline-block text-[11px] font-semibold text-[#D97706] bg-[#FFFBEB] border border-[#FDE68A]/60 px-2.5 py-0.5 rounded-full">
                        Tardanza
                      </span>
                    )}
                    {item.status === "ausente" && (
                      <span className="inline-block text-[11px] font-semibold text-[#DC2626] bg-[#FFF1F2] border border-[#FECDD3]/60 px-2.5 py-0.5 rounded-full">
                        Ausente
                      </span>
                    )}
                    {item.status === "permiso" && (
                      <span className="inline-block text-[11px] font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE]/60 px-2.5 py-0.5 rounded-full">
                        Permiso
                      </span>
                    )}
                    {item.status === "esperado" && (
                      <span className="inline-block text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                        Esperado
                      </span>
                    )}
                  </td>

                  {/* Entrada */}
                  <td className="py-3 px-3 text-gray-700 font-medium">
                    {item.checkIn ? (
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <svg
                          className="w-3.5 h-3.5 text-[#059669]"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          viewBox="0 0 24 24"
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                        <span>{item.checkIn}</span>
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  {/* Salida */}
                  <td className="py-3 px-3 text-gray-700 font-medium">
                    {item.checkOut === "En curso" ? (
                      <div className="flex items-center gap-1.5 text-[#D97706]">
                        <svg
                          className="w-3.5 h-3.5 text-[#D97706]"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span className="text-xs font-semibold">En curso</span>
                      </div>
                    ) : item.checkOut ? (
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <svg
                          className="w-3.5 h-3.5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>{item.checkOut}</span>
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  {/* Horas */}
                  <td className="py-3 px-3 text-gray-700 font-medium">
                    {item.hours ? item.hours : <span className="text-gray-300">—</span>}
                  </td>

                  {/* Nota */}
                  <td className="py-3 px-3">
                    {item.noteType === "warning" && (
                      <div className="flex items-center gap-1 text-[#D97706] font-semibold text-[11px]">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>{item.note}</span>
                      </div>
                    )}
                    {item.noteType === "danger" && (
                      <div className="flex items-center gap-1 text-[#DC2626] font-semibold text-[11px]">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{item.note}</span>
                      </div>
                    )}
                    {item.noteType === "info" && (
                      <div className="flex items-center gap-1 text-[#2563EB] font-semibold text-[11px]">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>{item.note}</span>
                      </div>
                    )}
                    {!item.noteType && (item.note ? <span>{item.note}</span> : <span className="text-gray-300">—</span>)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
