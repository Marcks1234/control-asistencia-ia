"use client";

import React, { useState, useEffect } from "react";
import { Employee } from "@/types/attendance";
import { INITIAL_EMPLOYEES } from "@/services/mockAttendanceData";

interface ManualRegistrationCardProps {
  employees?: Employee[];
  loading?: boolean;
  onRegisterCheckIn?: (
    employee: Employee
  ) => Promise<{ ok: boolean; mensaje?: string; error?: string }>;
  onRegisterCheckOut?: (
    employee: Employee
  ) => Promise<{ ok: boolean; mensaje?: string; error?: string }>;
}

function obtenerFechaActualFormateada(): string {
  const ahora = new Date();
  const dias = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return `${dias[ahora.getDay()]}, ${ahora.getDate()} de ${meses[ahora.getMonth()]} ${ahora.getFullYear()}`;
}

export default function ManualRegistrationCard({
  employees = INITIAL_EMPLOYEES,
  loading = false,
  onRegisterCheckIn,
  onRegisterCheckOut,
}: ManualRegistrationCardProps) {
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [guardando, setGuardando] = useState<boolean>(false);
  const [timeString, setTimeString] = useState<string>("08:00:00");
  const [fechaHoy, setFechaHoy] = useState<string>(obtenerFechaActualFormateada);

  useEffect(() => {
    if (
      employees.length > 0 &&
      (!selectedEmpId || !employees.some((e) => e.id === selectedEmpId))
    ) {
      // Priorizar seleccionar primero a quien aún no tiene entrada hoy (ej. Sofía Vega) para facilitar la prueba
      const sinEntrada = employees.find((e) => !e.checkIn);
      setSelectedEmpId(sinEntrada ? sinEntrada.id : employees[0].id);
    }
  }, [employees, selectedEmpId]);

  useEffect(() => {
    setFechaHoy(obtenerFechaActualFormateada());
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      setTimeString(`${h}:${m}:${s}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const selectedEmployee =
    employees.find((e) => e.id === selectedEmpId) ||
    employees[0] || {
      id: "none",
      name: "Cargando colaboradores...",
      department: "Operaciones",
      shift: "Turno Mañana",
      startTime: "08:00",
      shiftSchedule: "08:00 - 17:00",
      status: "esperado" as const,
      checkIn: null,
      checkOut: null,
    };

  const yaMarcoEntrada = Boolean(selectedEmployee.checkIn);
  const yaMarcoSalida = Boolean(
    selectedEmployee.checkOut && selectedEmployee.checkOut !== "En curso"
  );

  const handleCheckIn = async () => {
    if (!selectedEmployee || guardando || selectedEmployee.id === "none") return;
    setFeedbackMessage("");
    setErrorMessage("");

    if (yaMarcoEntrada) {
      setErrorMessage(
        `${selectedEmployee.name} ya tiene entrada registrada hoy a las ${selectedEmployee.checkIn}.`
      );
      return;
    }

    setGuardando(true);
    try {
      const res = await onRegisterCheckIn?.(selectedEmployee);
      if (res && !res.ok) {
        setErrorMessage(res.error || "No se pudo registrar la entrada.");
      } else {
        setFeedbackMessage(
          res?.mensaje ||
            `Entrada de ${selectedEmployee.name} registrada hoy correctamente.`
        );
      }
    } catch {
      setErrorMessage("Error al registrar entrada en la base de datos.");
    } finally {
      setGuardando(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedEmployee || guardando || selectedEmployee.id === "none") return;
    setFeedbackMessage("");
    setErrorMessage("");

    if (!yaMarcoEntrada) {
      setErrorMessage(
        `No se puede registrar salida: ${selectedEmployee.name} aún no ha registrado su entrada hoy.`
      );
      return;
    }

    if (yaMarcoSalida) {
      setErrorMessage(
        `${selectedEmployee.name} ya cerró su jornada hoy a las ${selectedEmployee.checkOut}.`
      );
      return;
    }

    setGuardando(true);
    try {
      const res = await onRegisterCheckOut?.(selectedEmployee);
      if (res && !res.ok) {
        setErrorMessage(res.error || "No se pudo registrar la salida.");
      } else {
        setFeedbackMessage(
          res?.mensaje ||
            `Salida de ${selectedEmployee.name} registrada hoy correctamente.`
        );
      }
    } catch {
      setErrorMessage("Error al registrar salida en la base de datos.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-6">
      {/* 1. Reloj Digital en Tiempo Real (Solo Día Actual) */}
      <div className="border border-slate-100 rounded-2xl py-6 px-4 text-center bg-[#FBFBFC]">
        <div className="flex items-center justify-center gap-2">
          <span
            className="text-5xl font-black tracking-tight text-gray-900 font-sans"
            suppressHydrationWarning
          >
            {timeString}
          </span>
        </div>
        <p
          className="text-xs text-gray-500 font-semibold mt-1"
          suppressHydrationWarning
        >
          {fechaHoy}
        </p>
        <span className="inline-block mt-2 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
          Control en tiempo real · Solo jornada de hoy
        </span>
      </div>

      {/* 2. Selector de Colaborador */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Seleccionar Empleado (Jornada Actual) *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <select
            value={selectedEmpId}
            onChange={(e) => {
              setSelectedEmpId(e.target.value);
              setFeedbackMessage("");
              setErrorMessage("");
            }}
            disabled={loading || employees.length === 0}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200/90 rounded-xl text-xs font-semibold text-gray-800 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs transition disabled:opacity-60"
          >
            {employees.map((emp) => {
              const estadoTexto = !emp.checkIn
                ? "Sin entrada hoy"
                : emp.checkOut === "En curso"
                ? `En turno (${emp.checkIn})`
                : `Jornada cerrada (${emp.checkIn} - ${emp.checkOut})`;
              return (
                <option key={emp.id} value={emp.id}>
                  {emp.name} — {estadoTexto}
                </option>
              );
            })}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Resumen del Colaborador Seleccionado Hoy */}
      <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center font-bold text-xs uppercase">
              {selectedEmployee.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2) || "EM"}
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 leading-snug">
                {selectedEmployee.name}
              </h4>
              <p className="text-[11px] text-gray-400">
                {selectedEmployee.department} · {selectedEmployee.shift}
              </p>
            </div>
          </div>

          {/* Badge de Estado Actual */}
          <div>
            {selectedEmployee.status === "tardanza" && (
              <span className="text-[11px] font-semibold text-[#D97706] bg-[#FEF3C7] border border-[#FDE68A] px-2.5 py-0.5 rounded-full">
                Tardanza
              </span>
            )}
            {selectedEmployee.status === "presente" && (
              <span className="text-[11px] font-semibold text-[#059669] bg-[#D1FAE5] border border-[#A7F3D0] px-2.5 py-0.5 rounded-full">
                Presente
              </span>
            )}
            {selectedEmployee.status === "ausente" && (
              <span className="text-[11px] font-semibold text-[#DC2626] bg-[#FEE2E2] border border-[#FECACA] px-2.5 py-0.5 rounded-full">
                Sin Entrada Hoy
              </span>
            )}
            {selectedEmployee.status === "permiso" && (
              <span className="text-[11px] font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-0.5 rounded-full">
                Permiso
              </span>
            )}
            {selectedEmployee.status === "esperado" && (
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                Esperado
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-gray-500 font-medium">
          <span>
            Entrada hoy:{" "}
            <strong className="text-gray-800">
              {selectedEmployee.checkIn || "Pendiente"}
            </strong>
          </span>
          <span>
            Salida hoy:{" "}
            <strong className="text-gray-800">
              {selectedEmployee.checkOut || "Pendiente"}
            </strong>
          </span>
        </div>
      </div>

      {/* 4. Mensajes de Confirmación o Regla de Negocio */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-600 text-xs font-semibold">
          {errorMessage}
        </div>
      )}

      {feedbackMessage && (
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-[#059669] text-xs font-semibold">
          <svg
            className="w-4 h-4 text-[#059669] shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* 5. Botones de Acción con Reglas Lógicas de Negocio */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={guardando || loading || yaMarcoEntrada}
          title={
            yaMarcoEntrada
              ? `Ya registró entrada hoy a las ${selectedEmployee.checkIn}`
              : "Registrar entrada de hoy"
          }
          className="flex items-center justify-center gap-2 bg-[#1754CF] hover:bg-[#1244A7] disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl text-xs font-bold shadow-xs transition active:scale-98 cursor-pointer"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          <span>
            {yaMarcoEntrada ? "Entrada Registrada" : "Registrar Entrada"}
          </span>
        </button>

        <button
          type="button"
          onClick={handleCheckOut}
          disabled={guardando || loading || !yaMarcoEntrada || yaMarcoSalida}
          title={
            !yaMarcoEntrada
              ? "Primero debe registrar su entrada de hoy"
              : yaMarcoSalida
              ? `Ya registró salida hoy a las ${selectedEmployee.checkOut}`
              : "Registrar salida de hoy"
          }
          className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-800 border border-gray-200/90 py-3 px-4 rounded-xl text-xs font-bold shadow-xs transition active:scale-98 cursor-pointer"
        >
          <svg
            className="w-4 h-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>
            {yaMarcoSalida ? "Salida Registrada" : "Registrar Salida"}
          </span>
        </button>
      </div>
    </div>
  );
}
