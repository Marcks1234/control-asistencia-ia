"use client";

import React, { useState, useEffect } from "react";
import { Employee } from "@/types/attendance";
import { obtenerFechaHoy } from "@/lib/dateUtils";
import { evaluarReglaEntrada } from "@/lib/utils";

interface ManualRegistrationCardProps {
  employees?: Employee[];
  loading?: boolean;
  onRegisterCheckIn?: (employee: Employee) => Promise<{ ok: boolean; mensaje?: string; error?: string }>;
  onRegisterCheckOut?: (employee: Employee) => Promise<{ ok: boolean; mensaje?: string; error?: string }>;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  presente: { label: "Presente", cls: "text-[#059669] bg-[#D1FAE5] border-[#A7F3D0]" },
  tardanza: { label: "Tardanza", cls: "text-[#D97706] bg-[#FEF3C7] border-[#FDE68A]" },
  ausente: { label: "Sin Entrada", cls: "text-[#DC2626] bg-[#FEE2E2] border-[#FECACA]" },
  permiso: { label: "Permiso", cls: "text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]" },
  esperado: { label: "Esperado", cls: "text-slate-600 bg-slate-100 border-slate-200" },
};

export default function ManualRegistrationCard({
  employees = [],
  loading = false,
  onRegisterCheckIn,
  onRegisterCheckOut,
}: ManualRegistrationCardProps) {
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [guardando, setGuardando] = useState<boolean>(false);
  const [timeString, setTimeString] = useState<string>("08:00:00");
  const [fechaHoy, setFechaHoy] = useState<string>(obtenerFechaHoy);

  useEffect(() => {
    if (employees.length > 0 && (!selectedEmpId || !employees.some((e) => e.id === selectedEmpId))) {
      const sinEntrada = employees.find((e) => !e.checkIn);
      setSelectedEmpId(sinEntrada ? sinEntrada.id : employees[0].id);
    }
  }, [employees, selectedEmpId]);

  useEffect(() => {
    setFechaHoy(obtenerFechaHoy());
    const interval = setInterval(() => {
      const now = new Date();
      setTimeString(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const selectedEmployee =
    employees.find((e) => e.id === selectedEmpId) ||
    employees[0] || {
      id: "none",
      name: "Cargando...",
      department: "Operaciones",
      shift: "Turno Mañana",
      startTime: "08:00",
      shiftSchedule: "08:00 - 17:00",
      status: "esperado" as const,
      checkIn: null,
      checkOut: null,
    };

  const yaMarcoEntrada = Boolean(selectedEmployee.checkIn);
  const yaMarcoSalida = Boolean(selectedEmployee.checkOut && selectedEmployee.checkOut !== "En curso");

  const validarVentanaEntrada = () => {
    if (!selectedEmployee || selectedEmployee.id === "none") {
      return { permitida: false, motivo: "Seleccione un colaborador válido." };
    }
    if (yaMarcoEntrada) {
      return { permitida: false, motivo: `${selectedEmployee.name} ya registró su entrada hoy a las ${selectedEmployee.checkIn}.` };
    }

    const [progEntrada = "08:00", progSalida = "17:00"] = (selectedEmployee.shiftSchedule || "08:00 - 17:00")
      .split("-")
      .map((s) => s.trim());
    const regla = evaluarReglaEntrada(
      { hora_entrada: `${progEntrada}:00`, hora_salida: `${progSalida}:00` },
      timeString,
      selectedEmployee.name
    );
    return { permitida: regla.permitida, motivo: regla.error };
  };

  const validacionEntrada = validarVentanaEntrada();
  const puedeMarcarEntrada = !yaMarcoEntrada && validacionEntrada.permitida;

  const ejecutarRegistro = async (
    tipo: "entrada" | "salida",
    callback?: (emp: Employee) => Promise<{ ok: boolean; mensaje?: string; error?: string }>
  ) => {
    if (!selectedEmployee || guardando || selectedEmployee.id === "none") return;
    setFeedbackMessage("");
    setErrorMessage("");

    if (tipo === "entrada" && !validacionEntrada.permitida) {
      setErrorMessage(validacionEntrada.motivo || "Fuera del horario establecido.");
      return;
    }
    if (tipo === "salida") {
      if (!yaMarcoEntrada) {
        setErrorMessage(`No se puede registrar salida: ${selectedEmployee.name} aún no registró entrada.`);
        return;
      }
      if (yaMarcoSalida) {
        setErrorMessage(`${selectedEmployee.name} ya cerró su jornada a las ${selectedEmployee.checkOut}.`);
        return;
      }
    }

    setGuardando(true);
    try {
      const res = await callback?.(selectedEmployee);
      if (res && !res.ok) setErrorMessage(res.error || `No se pudo registrar la ${tipo}.`);
      else setFeedbackMessage(res?.mensaje || `${tipo === "entrada" ? "Entrada" : "Salida"} de ${selectedEmployee.name} registrada.`);
    } catch {
      setErrorMessage(`Error al registrar ${tipo}.`);
    } finally {
      setGuardando(false);
    }
  };

  const badge = STATUS_BADGE[selectedEmployee.status] || STATUS_BADGE.esperado;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-6">
      <div className="border border-slate-100 rounded-2xl py-6 px-4 text-center bg-[#FBFBFC]">
        <span className="text-5xl font-black tracking-tight text-gray-900 font-sans" suppressHydrationWarning>
          {timeString}
        </span>
        <p className="text-xs text-gray-500 font-semibold mt-1" suppressHydrationWarning>
          {fechaHoy}
        </p>
        <span className="inline-block mt-2 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
          Control en tiempo real · Jornada de hoy
        </span>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Seleccionar Colaborador *
        </label>
        <select
          value={selectedEmpId}
          onChange={(e) => {
            setSelectedEmpId(e.target.value);
            setFeedbackMessage("");
            setErrorMessage("");
          }}
          disabled={loading || employees.length === 0}
          className="w-full px-4 py-2.5 bg-white border border-gray-200/90 rounded-xl text-xs font-semibold text-gray-800 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs transition disabled:opacity-60"
        >
          {employees.map((emp) => {
            const estado = !emp.checkIn
              ? "Sin entrada hoy"
              : emp.checkOut === "En curso"
              ? `En turno (${emp.checkIn})`
              : `Jornada cerrada (${emp.checkIn} - ${emp.checkOut})`;
            return (
              <option key={emp.id} value={emp.id}>
                {emp.name} — {estado}
              </option>
            );
          })}
        </select>
      </div>

      <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center font-bold text-xs uppercase">
              {selectedEmployee.name.split(" ").map((n) => n[0]).join("").slice(0, 2) || "EM"}
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 leading-snug">{selectedEmployee.name}</h4>
              <p className="text-[11px] text-gray-400">{selectedEmployee.department} · {selectedEmployee.shift}</p>
            </div>
          </div>
          <span className={`text-[11px] font-semibold border px-2.5 py-0.5 rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-gray-500 font-medium">
          <span>Entrada hoy: <strong className="text-gray-800">{selectedEmployee.checkIn || "Pendiente"}</strong></span>
          <span>Salida hoy: <strong className="text-gray-800">{selectedEmployee.checkOut || "Pendiente"}</strong></span>
        </div>

        {!yaMarcoEntrada && !validacionEntrada.permitida && (
          <div className="pt-2.5 border-t border-slate-100 text-amber-800 bg-amber-50/90 border border-amber-200/80 rounded-xl p-3 text-[11px] font-medium">
            <p className="leading-tight"><strong className="font-bold">Fuera de horario:</strong> {validacionEntrada.motivo}</p>
          </div>
        )}
      </div>

      {errorMessage && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-600 text-xs font-semibold">{errorMessage}</div>}
      {feedbackMessage && <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl px-4 py-2.5 text-[#059669] text-xs font-semibold">{feedbackMessage}</div>}

      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={() => ejecutarRegistro("entrada", onRegisterCheckIn)}
          disabled={guardando || loading || yaMarcoEntrada || !puedeMarcarEntrada}
          className="flex items-center justify-center gap-2 bg-[#1754CF] hover:bg-[#1244A7] disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl text-xs font-bold shadow-xs transition active:scale-98 cursor-pointer"
        >
          {yaMarcoEntrada ? "Entrada Registrada" : !validacionEntrada.permitida ? "Fuera de Horario" : "Registrar Entrada"}
        </button>

        <button
          type="button"
          onClick={() => ejecutarRegistro("salida", onRegisterCheckOut)}
          disabled={guardando || loading || !yaMarcoEntrada || yaMarcoSalida}
          className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-800 border border-gray-200/90 py-3 px-4 rounded-xl text-xs font-bold shadow-xs transition active:scale-98 cursor-pointer"
        >
          {yaMarcoSalida ? "Salida Registrada" : "Registrar Salida"}
        </button>
      </div>
    </div>
  );
}
