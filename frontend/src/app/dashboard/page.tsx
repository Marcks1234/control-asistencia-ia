"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { fetchAsistencias } from "@/services/asistenciaService";
import { AttendanceRecord, Employee } from "@/types/attendance";
import {
  Download,
  Users,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Search,
} from "lucide-react";

function getInitials(name: string): string {
  if (!name) return "CO";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [cargandoManual, setCargandoManual] = useState(false);

  const cargarDatos = async () => {
    try {
      setCargandoManual(true);
      const data = await fetchAsistencias();
      setEmployees(data.employees || []);
      setRecords(data.records || []);
    } catch (err) {
      console.warn("[DashboardPage] Error al consultar datos:", err);
    } finally {
      setLoading(false);
      setCargandoManual(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Mapeo rápido de roles de empleados
  const rolesMap = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((emp) => {
      map.set(emp.id, emp.role || "Colaborador");
    });
    return map;
  }, [employees]);

  // Cálculos estadísticos en tiempo real vinculados a Supabase
  const totalEmpleados = employees.length > 0 ? employees.length : records.length;

  const presentesHoy = records.filter(
    (r) => r.status === "presente" || r.status === "permiso"
  ).length;

  const tardanzasHoy = records.filter((r) => r.status === "tardanza").length;

  const ausentesHoy = records.filter((r) => r.status === "ausente").length;

  const porcentajeAsistencia =
    totalEmpleados > 0
      ? Math.round(((presentesHoy + tardanzasHoy) / totalEmpleados) * 100)
      : 0;

  const totalMarcaciones = presentesHoy + tardanzasHoy;
  const porcentajePuntualidad =
    totalMarcaciones > 0
      ? Math.round((presentesHoy / totalMarcaciones) * 100)
      : 100;

  // Filtrado de colaboradores según búsqueda global del TopBar o input local
  const registrosFiltrados = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase().trim();
    return records.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        (rolesMap.get(r.employeeId) || "").toLowerCase().includes(q) ||
        (r.checkIn && r.checkIn.includes(q))
    );
  }, [records, searchQuery, rolesMap]);

  // Exportar reporte consolidado real a CSV
  const exportarCSV = () => {
    const fecha = new Date().toISOString().slice(0, 10);
    const cabecera = [
      "Colaborador",
      "Cargo",
      "Departamento",
      "Hora Entrada",
      "Hora Salida",
      "Estado",
      "Horas Registradas",
      "Observación",
    ];

    const filas = registrosFiltrados.map((r) => {
      const cargo = rolesMap.get(r.employeeId) || "Colaborador";
      const estadoTexto =
        r.status === "presente"
          ? "Presente"
          : r.status === "tardanza"
          ? "Tardanza"
          : r.status === "permiso"
          ? "Permiso / Justificado"
          : "Ausente";

      return [
        `"${r.name}"`,
        `"${cargo}"`,
        `"${r.department}"`,
        `"${r.checkIn || "—"}"`,
        `"${r.checkOut || "—"}"`,
        `"${estadoTexto}"`,
        `"${r.hours || "—"}"`,
        `"${r.note || ""}"`,
      ].join(";");
    });

    const csvContent =
      "\uFEFF" + [cabecera.join(";"), ...filas].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte-asistencia-${fecha}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex bg-[#F4F7FB] text-slate-900">
      {/* Menú lateral compartido en todo el sistema */}
      <Sidebar activeItem="dashboard" />

      {/* Columna derecha unificada: TopBar general + Contenido */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="flex-1 px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto flex flex-col space-y-6">
          {/* ENCABEZADO PRINCIPAL DEL DASHBOARD */}
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
                onClick={cargarDatos}
                disabled={cargandoManual}
                title="Actualizar datos desde la base de datos"
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={`text-slate-500 ${cargandoManual ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Actualizar</span>
              </button>

              <button
                onClick={exportarCSV}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#273656] hover:bg-[#1f2b45] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Download size={14} />
                Exportar CSV
              </button>
            </div>
          </div>

          {/* TARJETAS DE INDICADORES EN TIEMPO REAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Empleados */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Colaboradores</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users size={16} />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-[#18243D]">
                  {loading ? "..." : totalEmpleados}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Total activos en planilla</div>
              </div>
            </div>

            {/* Presentes Hoy */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Presentes Hoy</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-600">
                    {loading ? "..." : presentesHoy}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    / {totalEmpleados}
                  </span>
                </div>
                <div className="text-[11px] font-medium text-emerald-600 mt-1">
                  {porcentajeAsistencia}% de asistencia total
                </div>
              </div>
            </div>

            {/* Tardanzas */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Tardanzas</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle size={16} />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-amber-600">
                  {loading ? "..." : tardanzasHoy}
                </div>
                <div className="text-[11px] font-medium text-amber-600 mt-1">
                  {tardanzasHoy > 0 ? "Requiere seguimiento" : "Sin tardanzas registradas"}
                </div>
              </div>
            </div>

            {/* Ausentes */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Ausentes</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <XCircle size={16} />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-rose-600">
                  {loading ? "..." : ausentesHoy}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Sin ingreso marcado a la fecha
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN PRINCIPAL: TABLA DE ASISTENCIAS Y PANELES LATERALES */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* TABLA PRINCIPAL DE COLABORADORES */}
            <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-[#18243D]">
                    Marcaciones de la Jornada
                  </h2>
                  <p className="text-xs text-slate-400">
                    Registros sincronizados con Supabase y el módulo de Entradas/Salidas
                  </p>
                </div>

                <div className="relative">
                  <Search
                    size={14}
                    className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                  />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar colaborador o área..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition w-full sm:w-56"
                  />
                </div>
              </div>

              {/* Contenido de la Tabla */}
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
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Cargando datos de asistencia...
                        </td>
                      </tr>
                    ) : registrosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No se encontraron registros que coincidan con la búsqueda.
                        </td>
                      </tr>
                    ) : (
                      registrosFiltrados.map((item) => {
                        const cargo = rolesMap.get(item.employeeId) || "Colaborador";
                        const iniciales = getInitials(item.name);

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/80 transition group"
                          >
                            <td className="py-3.5 px-2">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                                  {iniciales}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800">
                                    {item.name}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    ID: {item.employeeId.slice(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-2">
                              <div className="font-semibold text-slate-700">
                                {item.department}
                              </div>
                              <div className="text-[11px] text-slate-400">{cargo}</div>
                            </td>

                            <td className="py-3.5 px-2">
                              {item.checkIn ? (
                                <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                                  {item.checkIn}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">
                                  Sin marcar
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-2">
                              {item.checkOut ? (
                                <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                                  {item.checkOut}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">—</span>
                              )}
                            </td>

                            <td className="py-3.5 px-2 text-right">
                              {item.status === "presente" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Presente
                                </span>
                              ) : item.status === "tardanza" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  Tardanza
                                </span>
                              ) : item.status === "permiso" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                                  Justificado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  Ausente
                                </span>
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

            {/* PANELES LATERALES DERECHOS */}
            <div className="lg:col-span-4 space-y-5">
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
                  <Clock3 size={14} className="text-slate-400" />
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
                  <Sparkles size={14} />
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
                    className="inline-flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold transition"
                  >
                    <span>Ir a Entradas / Salidas</span>
                    <ArrowUpRight size={14} />
                  </Link>

                  <Link
                    href="/asistente-ia"
                    className="inline-flex items-center justify-between px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold transition"
                  >
                    <span>Abrir Asistente IA</span>
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
