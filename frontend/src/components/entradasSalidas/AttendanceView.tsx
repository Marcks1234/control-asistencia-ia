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

  const handleRegisterCheckIn = async (
    employee: Employee
  ): Promise<{ ok: boolean; mensaje?: string; error?: string }> => {
    const now = new Date();
    const timeFormatted = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const respuesta = await registrarEntradaEmpleado(
      employee.id,
      `${timeFormatted}:00`
    );

    if (!respuesta.ok) {
      return respuesta;
    }

    const fresca = await fetchAsistencias();
    setRecords(fresca.records || []);
    setEmployees(fresca.employees || []);

    return respuesta;
  };

  const handleRegisterCheckOut = async (
    employee: Employee
  ): Promise<{ ok: boolean; mensaje?: string; error?: string }> => {
    const now = new Date();
    const timeFormatted = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const respuesta = await registrarSalidaEmpleado(
      employee.id,
      `${timeFormatted}:00`
    );

    if (!respuesta.ok) {
      return respuesta;
    }

    const fresca = await fetchAsistencias();
    setRecords(fresca.records || []);
    setEmployees(fresca.employees || []);

    return respuesta;
  };

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
