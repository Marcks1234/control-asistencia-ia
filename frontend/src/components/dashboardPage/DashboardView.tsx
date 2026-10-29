"use client";

import React, { useState, useEffect, useMemo } from "react";
import DashboardHeader from "./DashboardHeader";
import DashboardStatsGrid from "./DashboardStatsGrid";
import DashboardAttendanceTable from "./DashboardAttendanceTable";
import DashboardSideWidgets from "./DashboardSideWidgets";
import { fetchAsistencias } from "@/services/asistenciaService";
import { AttendanceRecord, Employee } from "@/types/attendance";

interface DashboardViewProps {
  globalSearch?: string;
}

export default function DashboardView({ globalSearch = "" }: DashboardViewProps) {
  const [internalSearch, setInternalSearch] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sincronizar búsqueda global del TopBar con la tabla si el usuario escribe arriba
  useEffect(() => {
    if (globalSearch) {
      setInternalSearch(globalSearch);
    }
  }, [globalSearch]);

  const cargarDatos = async () => {
    try {
      setRefreshing(true);
      const data = await fetchAsistencias();
      setEmployees(data.employees || []);
      setRecords(data.records || []);
    } catch (err) {
      console.warn("[DashboardView] Error cargando datos de Supabase:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Mapeo en memoria de roles de empleados
  const rolesMap = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((emp) => {
      map.set(emp.id, emp.role || "Colaborador");
    });
    return map;
  }, [employees]);

  // Cálculos reactivos de métricas
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

  // Filtrado de la tabla según término de búsqueda
  const effectiveSearch = internalSearch || globalSearch;
  const registrosFiltrados = useMemo(() => {
    if (!effectiveSearch.trim()) return records;
    const q = effectiveSearch.toLowerCase().trim();
    return records.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        (rolesMap.get(r.employeeId) || "").toLowerCase().includes(q) ||
        (r.checkIn && r.checkIn.includes(q))
    );
  }, [records, effectiveSearch, rolesMap]);

  // Exportar reporte consolidado real a CSV
  const handleExportCSV = () => {
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
    <div className="w-full flex flex-col space-y-6">
      {/* 1. Encabezado con acciones */}
      <DashboardHeader
        onRefresh={cargarDatos}
        onExportCSV={handleExportCSV}
        loading={refreshing}
      />

      {/* 2. Grid de tarjetas de estadísticas */}
      <DashboardStatsGrid
        totalEmpleados={totalEmpleados}
        presentesHoy={presentesHoy}
        tardanzasHoy={tardanzasHoy}
        ausentesHoy={ausentesHoy}
        porcentajeAsistencia={porcentajeAsistencia}
        loading={loading}
      />

      {/* 3. Sección principal: Tabla + Widgets laterales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <DashboardAttendanceTable
            records={registrosFiltrados}
            rolesMap={rolesMap}
            searchQuery={internalSearch}
            onSearchChange={setInternalSearch}
            loading={loading}
          />
        </div>

        <div className="lg:col-span-4">
          <DashboardSideWidgets
            totalEmpleados={totalEmpleados}
            porcentajeAsistencia={porcentajeAsistencia}
            porcentajePuntualidad={porcentajePuntualidad}
            totalMarcaciones={totalMarcaciones}
          />
        </div>
      </div>
    </div>
  );
}

