"use client";

import React, { useState, useEffect, useMemo } from "react";
import DashboardHeader from "./DashboardHeader";
import DashboardStatsGrid from "./DashboardStatsGrid";
import DashboardAttendanceTable from "./DashboardAttendanceTable";
import DashboardSideWidgets from "./DashboardSideWidgets";
import { fetchAsistencias } from "@/services/asistenciaService";
import { AttendanceRecord, Employee } from "@/types/attendance";
import { exportarAsistenciasCSV } from "@/lib/exportCsv";

interface DashboardViewProps {
  globalSearch?: string;
}

export default function DashboardView({ globalSearch = "" }: DashboardViewProps) {
  const [internalSearch, setInternalSearch] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (globalSearch) setInternalSearch(globalSearch);
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

  const rolesMap = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((emp) => map.set(emp.id, emp.role || "Colaborador"));
    return map;
  }, [employees]);

  // Métricas reactivas
  const totalEmpleados = employees.length > 0 ? employees.length : records.length;
  const presentesHoy = records.filter((r) => r.status === "presente" || r.status === "permiso").length;
  const tardanzasHoy = records.filter((r) => r.status === "tardanza").length;
  const ausentesHoy = records.filter((r) => r.status === "ausente").length;
  const totalMarcaciones = presentesHoy + tardanzasHoy;
  const porcentajeAsistencia = totalEmpleados > 0 ? Math.round((totalMarcaciones / totalEmpleados) * 100) : 0;
  const porcentajePuntualidad = totalMarcaciones > 0 ? Math.round((presentesHoy / totalMarcaciones) * 100) : 100;

  // Filtrado de registros
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

  return (
    <div className="w-full flex flex-col space-y-6">
      <DashboardHeader
        onRefresh={cargarDatos}
        onExportCSV={() => exportarAsistenciasCSV(registrosFiltrados, rolesMap)}
        loading={refreshing}
      />

      <DashboardStatsGrid
        totalEmpleados={totalEmpleados}
        presentesHoy={presentesHoy}
        tardanzasHoy={tardanzasHoy}
        ausentesHoy={ausentesHoy}
        porcentajeAsistencia={porcentajeAsistencia}
        loading={loading}
      />

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
