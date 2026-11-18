"use client";

import React, { useState, useEffect } from "react";
import ModalDialog from "@/components/ui/ModalDialog";
import { Camara } from "@/models/Camara";
import { EmpleadoItem } from "@/services/empleadoService";

interface BiometricRecognitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  camara: Camara | null;
  empleados: EmpleadoItem[];
  onConfirmar: (payload: {
    employeeId: string;
    camaraId: string;
    puntoAcceso: string;
    confianza: number;
    accion: "auto" | "check-in" | "check-out";
  }) => Promise<void>;
  procesando: boolean;
}

const ACCIONES = [
  { id: "auto", label: "Automático", desc: "Entrada o Salida según estado" },
  { id: "check-in", label: "Entrada", desc: "Marcar ingreso" },
  { id: "check-out", label: "Salida", desc: "Marcar fin de jornada" },
] as const;

export default function BiometricRecognitionModal({
  isOpen,
  onClose,
  camara,
  empleados,
  onConfirmar,
  procesando,
}: BiometricRecognitionModalProps) {
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [accion, setAccion] = useState<"auto" | "check-in" | "check-out">("auto");
  const [confianza, setConfianza] = useState(98.8);

  useEffect(() => {
    if (empleados.length > 0 && !selectedEmpId) setSelectedEmpId(empleados[0].id);
  }, [empleados, selectedEmpId]);

  if (!camara) return null;

  const empleadoSeleccionado = empleados.find((e) => e.id === selectedEmpId);
  const iniciales = empleadoSeleccionado
    ? `${empleadoSeleccionado.nombre[0] || ""}${empleadoSeleccionado.apellido[0] || ""}`.toUpperCase()
    : "EM";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return;
    await onConfirmar({
      employeeId: selectedEmpId,
      camaraId: camara.id,
      puntoAcceso: camara.punto_acceso,
      confianza,
      accion,
    });
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Marcación Manual por Cámara"
      subtitle={
        <>
          Punto de captura: <strong className="text-slate-700">{camara.nombre}</strong> ({camara.punto_acceso})
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-800 mb-1.5">Colaborador Identificado por Cámara *</label>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white text-slate-900 font-medium focus:outline-hidden focus:border-blue-600 transition"
          >
            {empleados.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nombre} {emp.apellido} — {emp.cargo || "Colaborador"} ({emp.departamentos?.nombre || "General"})
              </option>
            ))}
          </select>
        </div>

        {empleadoSeleccionado && (
          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#1D4ED8] text-white font-bold text-sm flex items-center justify-center shadow-xs">
                {iniciales}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">
                  {empleadoSeleccionado.nombre} {empleadoSeleccionado.apellido}
                </h4>
                <p className="text-[11px] text-slate-500">
                  DNI: <span className="font-semibold text-slate-700">{empleadoSeleccionado.dni}</span> • Cód:{" "}
                  <span className="font-semibold text-blue-700">{empleadoSeleccionado.codigo_biometrico}</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Turno: {empleadoSeleccionado.horarios?.descripcion || "Turno Mañana (08:00 - 17:00)"}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Rostro Activo
            </span>
          </div>
        )}

        <div>
          <label className="block font-bold text-slate-800 mb-1.5">Tipo de Marcación</label>
          <div className="grid grid-cols-3 gap-2">
            {ACCIONES.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAccion(opt.id)}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  accion === opt.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs font-bold"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="text-xs">{opt.label}</div>
                <div className="text-[9px] opacity-75 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700">Nivel de Confianza Biométrica:</span>
            <span className="font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[11px]">
              {confianza.toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="92.0"
            max="99.9"
            step="0.1"
            value={confianza}
            onChange={(e) => setConfianza(parseFloat(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>92.0% (Mínimo recomendado)</span>
            <span>99.9% (Coincidencia exacta)</span>
          </div>
        </div>

        <div className="pt-3 border-t flex justify-end gap-2.5">
          <button type="button" onClick={onClose} disabled={procesando} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={procesando || !selectedEmpId}
            className="px-5 py-2 rounded-xl bg-[#1D4ED8] hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {procesando ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Validando y Guardando...</span>
              </>
            ) : (
              <span>Confirmar y Guardar Asistencia</span>
            )}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
}
