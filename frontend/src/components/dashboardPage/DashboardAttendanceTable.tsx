"use client";

import React from "react";
import { AttendanceRecord } from "@/types/attendance";

interface DashboardAttendanceTableProps {
  records: AttendanceRecord[];
  rolesMap: Map<string, string>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  loading: boolean;
}

const BADGES: Record<string, { label: string; cls: string; dot?: string }> = {
  presente: { label: "Presente", cls: "bg-emerald-50 text-emerald-700 border-emerald-200/60", dot: "bg-emerald-500" },
  tardanza: { label: "Tardanza", cls: "bg-amber-50 text-amber-700 border-amber-200/60", dot: "bg-amber-500" },
  permiso: { label: "Justificado", cls: "bg-blue-50 text-blue-700 border-blue-200/60" },
  ausente: { label: "Ausente", cls: "bg-rose-50 text-rose-700 border-rose-200/60", dot: "bg-rose-500" },
};

function getInitials(name: string): string {
  if (!name) return "CO";
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function DashboardAttendanceTable({
  records,
  rolesMap,
  searchQuery,
  onSearchChange,
  loading,
}: DashboardAttendanceTableProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-[#18243D]">Marcaciones de la Jornada</h2>
          <p className="text-xs text-slate-400">Registros sincronizados con Supabase y el módulo de Entradas/Salidas</p>
        </div>

        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filtrar colaborador o área..."
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-blue-500 transition w-full sm:w-56"
        />
      </div>

      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-2">Colaborador</th>
              <th className="py-3.5 px-2">Área / Cargo</th>
              <th className="py-3.5 px-2">Entrada</th>
              <th className="py-3.5 px-2">Salida</th>
              <th className="py-3.5 px-2 text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400">Cargando datos de asistencia...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400">No se encontraron registros coincidentes.</td></tr>
            ) : (
              records.map((item) => {
                const cargo = rolesMap.get(item.employeeId) || "Colaborador";
                const b = BADGES[item.status] || BADGES.ausente;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                          {getInitials(item.name)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{item.name}</div>
                          <div className="text-[11px] text-slate-400">ID: {item.employeeId.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-2">
                      <div className="font-semibold text-slate-700">{item.department}</div>
                      <div className="text-[11px] text-slate-400">{cargo}</div>
                    </td>
                    <td className="py-3.5 px-2">
                      {item.checkIn ? (
                        <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">{item.checkIn}</span>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Sin marcar</span>
                      )}
                    </td>
                    <td className="py-3.5 px-2">
                      {item.checkOut ? (
                        <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">{item.checkOut}</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${b.cls}`}>
                        {b.dot && <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />}
                        {b.label}
                      </span>
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
