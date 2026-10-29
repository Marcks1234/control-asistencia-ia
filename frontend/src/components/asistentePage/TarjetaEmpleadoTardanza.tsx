"use client";

import { useState } from "react";
import { EmpleadoTardanza } from "@/types/asistente";
import { justificarTardanzaColaborador } from "@/services/asistenteService";

interface TarjetaEmpleadoTardanzaProps {
  empleado: EmpleadoTardanza;
  onJustificado?: () => void;
}

export default function TarjetaEmpleadoTardanza({
  empleado,
  onJustificado,
}: TarjetaEmpleadoTardanzaProps) {
  const [justificado, setJustificado] = useState(empleado.estado === "JUSTIFICADO");
  const [cargandoJustificacion, setCargandoJustificacion] = useState(false);
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);

  const manejarJustificar = async () => {
    if (justificado || cargandoJustificacion) return;
    setCargandoJustificacion(true);
    await justificarTardanzaColaborador(
      empleado.id,
      "Justificación aprobada por Gerencia RRHH desde Asistente IA"
    );
    setJustificado(true);
    setCargandoJustificacion(false);
    onJustificado?.();
  };

  return (
    <>
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 max-w-md shadow-xs mt-1">
        {/* Cabecera del empleado */}
        <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
              {empleado.iniciales || "MG"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">
                  {empleado.nombre}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {empleado.codigo_biometrico}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {empleado.departamento} · {empleado.turno}
              </p>
            </div>
          </div>

          {/* Pill de estado / minutos */}
          {justificado ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Justificado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[11px] font-bold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              +{empleado.minutos_tardanza} min
            </span>
          )}
        </div>

        {/* Bloque gris de Hora de Entrada y Punto de Acceso */}
        <div className="mt-3.5 bg-slate-50/90 rounded-xl p-3.5 grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Hora de Entrada
            </div>
            <div className="text-sm font-extrabold text-red-600 mt-0.5">
              {empleado.hora_entrada}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Punto de Acceso
            </div>
            <div className="text-xs font-semibold text-slate-800 mt-1">
              {empleado.punto_acceso}
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-4 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMostrarModalDetalle(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1D63ED] hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>Ver detalle</span>
          </button>

          <button
            type="button"
            onClick={manejarJustificar}
            disabled={justificado || cargandoJustificacion}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition ${
              justificado
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6M9 15l2 2 4-4" />
            </svg>
            <span>
              {cargandoJustificacion
                ? "Guardando..."
                : justificado
                ? "Tardanza justificada"
                : "Justificar"}
            </span>
          </button>
        </div>
      </div>

      {/* Modal de detalle biométrico */}
      {mostrarModalDetalle && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Ficha de Marcación Biométrica
                </h3>
                <p className="text-xs text-slate-500">
                  Registro validado por reconocimiento facial IA
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalDetalle(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
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
                <span className="font-semibold text-slate-800">
                  {empleado.departamento} · {empleado.turno}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Hora de ingreso:</span>
                <span className="font-bold text-red-600">
                  {empleado.hora_entrada} (+{empleado.minutos_tardanza} min)
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Cámara / Acceso:</span>
                <span className="font-semibold text-slate-800">{empleado.punto_acceso}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Confianza Facial IA:</span>
                <span className="font-bold text-emerald-600">
                  {empleado.confianza_ia ?? 98.4}% óptima
                </span>
              </div>
              <div className="pt-1">
                <span className="text-slate-500 block mb-1">Motivo / Observación:</span>
                <p className="p-2.5 rounded-lg bg-slate-50 text-slate-700">
                  {empleado.motivo || "Congestión vehicular reportada en ingreso."}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMostrarModalDetalle(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

