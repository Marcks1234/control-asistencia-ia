"use client";

import { useState, useEffect } from "react";
import { EmpleadoTardanza } from "@/types/asistente";
import { justificarTardanzaColaborador } from "@/services/asistenteService";
import ModalDetalleBiometrico from "./ModalDetalleBiometrico";

interface TarjetaEmpleadoTardanzaProps {
  empleado: EmpleadoTardanza;
  onJustificado?: () => void;
}

export default function TarjetaEmpleadoTardanza({
  empleado,
  onJustificado,
}: TarjetaEmpleadoTardanzaProps) {
  const [justificado, setJustificado] = useState(empleado.estado === "JUSTIFICADO");
  const [cargando, setCargando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    setJustificado(empleado.estado === "JUSTIFICADO");
  }, [empleado.estado]);

  const esFalta = empleado.estado === "FALTA";

  const manejarJustificar = async () => {
    if (justificado || cargando) return;
    setCargando(true);
    const motivo = esFalta
      ? "Inasistencia justificada por Administración"
      : "Tardanza justificada por Administración";

    const res = await justificarTardanzaColaborador(empleado.id, motivo);
    if (res?.ok) {
      setJustificado(true);
      onJustificado?.();
    }
    setCargando(false);
  };

  return (
    <>
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 max-w-md shadow-xs mt-1">
        <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
              {empleado.iniciales || "EM"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{empleado.nombre}</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {empleado.codigo_biometrico}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{empleado.departamento} · {empleado.turno}</p>
            </div>
          </div>

          {justificado ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Justificado
            </span>
          ) : esFalta ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-[11px] font-bold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Falta
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-[11px] font-bold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              +{empleado.minutos_tardanza} min
            </span>
          )}
        </div>

        <div className="mt-3.5 bg-slate-50/90 rounded-xl p-3.5 grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Hora de Entrada</div>
            <div className={`text-sm font-extrabold mt-0.5 ${esFalta ? "text-slate-500" : "text-amber-600"}`}>
              {empleado.hora_entrada}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Punto de Acceso</div>
            <div className="text-xs font-semibold text-slate-800 mt-1">{empleado.punto_acceso}</div>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-4 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMostrarModal(true)}
            className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#1D63ED] hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer"
          >
            Ver detalle
          </button>

          <button
            type="button"
            onClick={manejarJustificar}
            disabled={justificado || cargando}
            className={`inline-flex items-center px-3.5 py-1.5 rounded-full border text-xs font-semibold transition ${
              justificado
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
            }`}
          >
            {cargando ? "Guardando..." : justificado ? "Justificado" : "Justificar"}
          </button>
        </div>
      </div>

      {mostrarModal && (
        <ModalDetalleBiometrico empleado={empleado} onClose={() => setMostrarModal(false)} />
      )}
    </>
  );
}
