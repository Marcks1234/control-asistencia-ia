"use client";

import React, { useEffect, useRef, useState } from "react";
import ModalDialog from "@/components/ui/ModalDialog";
import { EmpleadoItem, actualizarBiometriaEmpleado } from "@/services/empleadoService";
import { comprimirImagenFacial, extractFaceDescriptor } from "@/lib/faceRecognition";

interface EnrollFaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  empleados: EmpleadoItem[];
  onEnrolled: (empId: string, fotoUrl: string, descriptor: number[]) => void;
}

export default function EnrollFaceModal({
  isOpen,
  onClose,
  empleados,
  onEnrolled,
}: EnrollFaceModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [streamError, setStreamError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [estadoMsg, setEstadoMsg] = useState<{ tipo: "ok" | "err" | "info"; texto: string } | null>(null);

  useEffect(() => {
    if (empleados.length > 0 && !selectedEmpId) setSelectedEmpId(empleados[0].id);
  }, [empleados, selectedEmpId]);

  useEffect(() => {
    if (!isOpen) return;
    let activeStream: MediaStream | null = null;
    let cancelled = false;
    setStreamError(null);
    setEstadoMsg(null);

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        activeStream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => {
        if (!cancelled) setStreamError("No se pudo abrir la webcam. Puedes subir una foto desde archivo.");
      });

    return () => {
      cancelled = true;
      activeStream?.getTracks().forEach((t) => t.stop());
    };
  }, [isOpen]);

  const guardarReferencia = async (fotoDataUrl: string) => {
    if (!selectedEmpId) return;
    setProcesando(true);
    setEstadoMsg({ tipo: "info", texto: "Procesando imagen..." });

    try {
      const descriptor = await extractFaceDescriptor(fotoDataUrl);
      if (!descriptor) {
        return setEstadoMsg({
          tipo: "err",
          texto: "No se detectó un rostro frontal claro. Mira directamente a la cámara con buena luz.",
        });
      }

      const res = await actualizarBiometriaEmpleado(selectedEmpId, fotoDataUrl, descriptor);
      if (res.ok) {
        setEstadoMsg({ tipo: "ok", texto: "Rostro guardado correctamente." });
        onEnrolled(selectedEmpId, fotoDataUrl, descriptor);
        setTimeout(() => onClose(), 900);
      } else {
        setEstadoMsg({ tipo: "err", texto: res.error || "Error al guardar en Supabase." });
      }
    } catch (err: any) {
      setEstadoMsg({ tipo: "err", texto: err?.message || "Error al procesar biometría." });
    } finally {
      setProcesando(false);
    }
  };

  const handleCapturarWebcam = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      return setEstadoMsg({ tipo: "err", texto: "La cámara aún no está lista." });
    }
    const fotoDataUrl = await comprimirImagenFacial(video);
    await guardarReferencia(fotoDataUrl);
  };

  const handleSubirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const fotoDataUrl = await comprimirImagenFacial(file);
    await guardarReferencia(fotoDataUrl);
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Registro de Rostro"
      subtitle="Registra la referencia facial del colaborador para el reconocimiento automático en cámara."
    >
      <div className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-800 mb-1">Seleccionar Colaborador *</label>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 text-slate-900 font-medium"
          >
            {empleados.map((emp) => {
              const tiene = Array.isArray(emp.descripcion_facial) && emp.descripcion_facial.length === 128;
              return (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre} {emp.apellido} ({emp.dni}) — {tiene ? "Rostro Registrado" : "Pendiente"}
                </option>
              );
            })}
          </select>
        </div>

        <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
          {streamError ? (
            <p className="text-amber-300 text-xs text-center px-6">{streamError}</p>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-40 h-48 border-2 border-dashed border-emerald-400/80 rounded-2xl" />
              </div>
            </>
          )}
        </div>

        {estadoMsg && (
          <div
            className={`p-2.5 rounded-xl text-xs font-semibold ${
              estadoMsg.tipo === "ok"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : estadoMsg.tipo === "err"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}
          >
            {estadoMsg.texto}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
          <label className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleSubirArchivo} disabled={procesando} />
            Subir Foto Frontal
          </label>

          <div className="flex gap-2">
            <button type="button" onClick={onClose} disabled={procesando} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer">
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleCapturarWebcam}
              disabled={procesando || Boolean(streamError) || !selectedEmpId}
              className="px-4 py-2 rounded-xl bg-[#1D4ED8] hover:bg-blue-700 text-white font-bold disabled:opacity-50 cursor-pointer"
            >
              {procesando ? "Procesando imagen..." : "Capturar y Guardar"}
            </button>
          </div>
        </div>
      </div>
    </ModalDialog>
  );
}
