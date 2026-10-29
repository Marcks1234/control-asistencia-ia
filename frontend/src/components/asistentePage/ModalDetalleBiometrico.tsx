"use client";

import React from "react";
import { EmpleadoTardanza } from "@/types/asistente";

interface ModalDetalleBiometricoProps {
  empleado: EmpleadoTardanza;
  onClose: () => void;
}

export default function ModalDetalleBiometrico({ empleado, onClose }: ModalDetalleBiometricoProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Detalle de Marcación</h3>
            <p className="text-xs text-slate-500">Registro de control de asistencia</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between py-1.5 border-b border-slate-50">
            <span className="text-slate-500">Colaborador:</span>
            <span className="font-bold text-slate-800">{empleado.nombre}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-50">
            <span className="text-slate-500">ID Biométrico:</span>
            <span className="font-semibold text-blue-600">{empleado.codigo_biometrico}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-50">
            <span className="text-slate-500">Departamento / Turno:</span>
            <span className="font-semibold text-slate-800">{empleado.departamento} · {empleado.turno}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-50">
            <span className="text-slate-500">Hora de ingreso:</span>
            <span className={`font-bold ${empleado.estado === 'FALTA' ? 'text-slate-500' : 'text-red-600'}`}>
              {empleado.estado === 'FALTA' ? 'Sin registro de ingreso (Falta)' : `${empleado.hora_entrada} (+${empleado.minutos_tardanza} min)`}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-50">
            <span className="text-slate-500">Cámara / Acceso:</span>
            <span className="font-semibold text-slate-800">{empleado.punto_acceso}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-50">
            <span className="text-slate-500">Validación de identidad:</span>
            <span className="font-bold text-emerald-600">Verificado</span>
          </div>
          <div className="pt-1">
            <span className="text-slate-500 block mb-1">Motivo / Observación:</span>
            <p className="p-2.5 rounded-lg bg-slate-50 text-slate-700">
              {empleado.motivo || "Sin observaciones adicionales."}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

