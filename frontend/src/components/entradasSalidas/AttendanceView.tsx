"use client";

import React, { useState, useEffect } from "react";
import PageHeader from "./PageHeader";
import ManualRegistrationCard from "./ManualRegistrationCard";
import DailyAttendanceCard from "./DailyAttendanceCard";
import { INITIAL_ATTENDANCE_RECORDS, INITIAL_EMPLOYEES } from "@/services/mockAttendanceData";
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
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [records, setRecords] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE_RECORDS);
  const [loading, setLoading] = useState<boolean>(true);

  // Cargar datos reales desde Supabase al iniciar
  useEffect(() => {
    let cancelado = false;
    async function cargarDatos() {
      try {
        const data = await fetchAsistencias();
        if (!cancelado) {
          if (data.employees.length > 0) setEmployees(data.employees);
          if (data.records.length > 0) setRecords(data.records);
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

  const handleRegisterCheckIn = async (employee: Employee) => {
    const now = new Date();
    const timeFormatted = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    // 1. Actualización optimista inmediata en la UI
    setRecords((prev) => {
      const existingIndex = prev.findIndex((r) => r.employeeId === employee.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          status: "presente",
          checkIn: timeFormatted,
          checkOut: "En curso",
          note: null,
          noteType: undefined,
        };
        return updated;
      } else {
        const newRecord: AttendanceRecord = {
          id: `rec-${Date.now()}`,
          employeeId: employee.id,
          name: employee.name,
          department: employee.department,
          shift: employee.shift,
          shiftTime: employee.startTime,
          status: "presente",
          checkIn: timeFormatted,
          checkOut: "En curso",
          hours: "0h 01m",
          note: null,
        };
        return [newRecord, ...prev];
      }
    });

    setEmployees((prev) =>
      prev.map((e) => (e.id === employee.id ? { ...e, status: "presente" } : e))
    );

    // 2. Persistencia en la base de datos Supabase
    await registrarEntradaEmpleado(employee.id, `${timeFormatted}:00`);

    // 3. Re-sincronizar con Supabase para confirmar
    const fresca = await fetchAsistencias();
    if (fresca.records.length > 0) setRecords(fresca.records);
    if (fresca.employees.length > 0) setEmployees(fresca.employees);
  };

  const handleRegisterCheckOut = async (employee: Employee) => {
    const now = new Date();
    const timeFormatted = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    // 1. Actualización optimista inmediata
    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.employeeId === employee.id) {
          return {
            ...rec,
            checkOut: timeFormatted,
            hours: "8h 00m",
          };
        }
        return rec;
      })
    );

    // 2. Persistencia en la base de datos Supabase
    await registrarSalidaEmpleado(employee.id, `${timeFormatted}:00`);

    // 3. Re-sincronizar con Supabase para confirmar
    const fresca = await fetchAsistencias();
    if (fresca.records.length > 0) setRecords(fresca.records);
    if (fresca.employees.length > 0) setEmployees(fresca.employees);
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Page Title & Shift Badge */}
      <PageHeader />

      {/* Main 2-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Manual Registration Card (5 of 12 cols on desktop) */}
        <div className="lg:col-span-5">
          <ManualRegistrationCard
            employees={employees}
            loading={loading}
            onRegisterCheckIn={handleRegisterCheckIn}
            onRegisterCheckOut={handleRegisterCheckOut}
          />
        </div>

        {/* Right Column: Daily Attendance Table Card (7 of 12 cols on desktop) */}
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
