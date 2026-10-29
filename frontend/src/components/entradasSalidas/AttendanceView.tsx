"use client";

import React, { useState, useEffect } from "react";
import PageHeader from "./PageHeader";
import ManualRegistrationCard from "./ManualRegistrationCard";
import DailyAttendanceCard from "./DailyAttendanceCard";
import { AttendanceRecord, Employee } from "@/types/attendance";
import {
  fetchAsistencias,
  registrarEntradaEmpleado,
  registrarSalidaEmpleado,
} from "@/services/asistenciaService";

interface AttendanceViewProps {
  globalSearch?: string;
}

export default function AttendanceView({ globalSearch = "" }: AttendanceViewProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelado = false;
    async function cargarDatos() {
      try {
        const data = await fetchAsistencias();
        if (!cancelado) {
          setEmployees(data.employees || []);
          setRecords(data.records || []);
        }
      } catch (err) {
        console.warn("[AttendanceView] Error cargando asistencias de Supabase:", err);
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    cargarDatos();
    return () => {
      cancelado = true;
    };
  }, []);

  const ejecutarMarcacion = async (
    accion: (id: string, hora: string) => Promise<{ ok: boolean; mensaje?: string; error?: string }>,
    employee: Employee
  ): Promise<{ ok: boolean; mensaje?: string; error?: string }> => {
    const now = new Date();
    const hora = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
    const respuesta = await accion(employee.id, hora);
    if (respuesta.ok) {
      const fresca = await fetchAsistencias();
      setRecords(fresca.records || []);
      setEmployees(fresca.employees || []);
    }
    return respuesta;
  };

  const handleRegisterCheckIn = (emp: Employee) => ejecutarMarcacion(registrarEntradaEmpleado, emp);
  const handleRegisterCheckOut = (emp: Employee) => ejecutarMarcacion(registrarSalidaEmpleado, emp);

  return (
    <div className="w-full flex flex-col space-y-6">
      <PageHeader />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5">
          <ManualRegistrationCard
            employees={employees}
            loading={loading}
            onRegisterCheckIn={handleRegisterCheckIn}
            onRegisterCheckOut={handleRegisterCheckOut}
          />
        </div>

        <div className="lg:col-span-7">
          <DailyAttendanceCard
            records={records}
            externalSearch={globalSearch}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
