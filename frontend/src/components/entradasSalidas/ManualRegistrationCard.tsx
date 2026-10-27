"use client";

import React, { useState, useEffect } from "react";
import { Employee } from "@/types/attendance";
import { INITIAL_EMPLOYEES } from "@/services/mockAttendanceData";

interface ManualRegistrationCardProps {
  onRegisterCheckIn?: (employee: Employee) => void;
  onRegisterCheckOut?: (employee: Employee) => void;
}

export default function ManualRegistrationCard({
  onRegisterCheckIn,
  onRegisterCheckOut,
}: ManualRegistrationCardProps) {
  const [employees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [selectedEmpId, setSelectedEmpId] = useState<string>("emp-1");
  const [feedbackMessage, setFeedbackMessage] = useState<string>(
    "Salida registrada a las 09:33"
  );
  const [timeString, setTimeString] = useState<string>("18:20:53");
  const [isLiveClock, setIsLiveClock] = useState<boolean>(false);

  // Optional live clock ticking (if user wants live clock)
  useEffect(() => {
    if (!isLiveClock) {
      setTimeString("18:20:53");
      return;
    }
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
  }, [isLiveClock]);

  const selectedEmployee =
    employees.find((e) => e.id === selectedEmpId) || employees[0];

  const handleCheckIn = () => {
    const now = new Date();
    const timeFormatted = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
    setFeedbackMessage(`Entrada registrada a las ${timeFormatted}`);
    onRegisterCheckIn?.(selectedEmployee);
  };

  const handleCheckOut = () => {
    const now = new Date();
    const timeFormatted = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
    setFeedbackMessage(`Salida registrada a las ${timeFormatted}`);
    onRegisterCheckOut?.(selectedEmployee);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col justify-between space-y-6">
      {/* 1. Digital Clock Box */}
      <div className="border border-gray-100 rounded-2xl py-6 px-4 text-center bg-[#FBFBFC]">
        <div className="flex items-center justify-center gap-2">
          <span className="text-5xl font-black tracking-tight text-gray-900 font-sans">
            {timeString}
          </span>
          <button
            type="button"
            title={isLiveClock ? "Pausar reloj en vivo" : "Activar reloj en tiempo real"}
            onClick={() => setIsLiveClock(!isLiveClock)}
            className="text-[10px] text-gray-400 hover:text-blue-600 transition"
          >
            {isLiveClock ? "● Vivo" : "⏸"}
          </button>
        </div>
        <p className="text-xs text-gray-400 font-medium mt-1">
          Lunes, 7 de Septiembre 2026
        </p>
      </div>

      {/* 2. Employee Selector */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Seleccionar Empleado *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200/90 rounded-xl text-xs font-semibold text-gray-800 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs transition"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Selected Employee Profile Preview Box */}
      <div className="bg-[#F8FAFC] border border-gray-100 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center font-bold text-xs">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
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

          {/* Status Badge */}
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
                Ausente
              </span>
            )}
          </div>
        </div>

        {/* Turno and Inicio */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-500 font-medium">
          <span>Turno: {selectedEmployee.shift}</span>
          <span>Inicio: {selectedEmployee.startTime}</span>
        </div>
      </div>

      {/* 4. Feedback / Status Pill */}
      {feedbackMessage && (
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-[#059669] text-xs font-semibold">
          <svg
            className="w-4 h-4 text-[#059669] shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* 5. Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={handleCheckIn}
          className="flex items-center justify-center gap-2 bg-[#1754CF] hover:bg-[#1244A7] text-white py-3 px-4 rounded-xl text-xs font-bold shadow-xs transition active:scale-98"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          <span>Registrar Entrada</span>
        </button>

        <button
          type="button"
          onClick={handleCheckOut}
          className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200/90 py-3 px-4 rounded-xl text-xs font-bold shadow-xs transition active:scale-98"
        >
          <svg
            className="w-4 h-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Registrar Salida</span>
        </button>
      </div>
    </div>
  );
}

