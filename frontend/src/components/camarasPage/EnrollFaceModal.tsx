"use client";

import React, { useEffect, useRef, useState } from "react";
import { EmpleadoItem, actualizarBiometriaEmpleado } from "@/services/empleadoService";
import { extractFaceDescriptor } from "@/lib/faceRecognition";

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
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [streamError, setStreamError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [estadoMsg, setEstadoMsg] = useState<{ tipo: "ok" | "err" | "info"; texto: string } | null>(null);

  useEffect(() => {
    if (empleados.length > 0 && !selectedEmpId) {
      setSelectedEmpId(empleados[0].id);
    }
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
        if (!cancelled) {
          setStreamError("No se pudo abrir la webcam. Puedes subir una foto desde archivo.");
        }
      });

    return () => {
      cancelled = true;
      if (activeStream) activeStream.getTracks().forEach((t) => t.stop());
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const procesarYGuardarImagen = async (canvasOrUrl: HTMLCanvasElement | string) => {
    if (!selectedEmpId) return;
    setProcesando(true);
    setEstadoMsg({ tipo: "info", texto: "Analizando rostro con face-api.js (CNN 128D)..." });

    try {
      const descriptor = await extractFaceDescriptor(canvasOrUrl);
      if (!descriptor) {
        setProcesando(false);
        return setEstadoMsg({
          tipo: "err",
          texto: "No se detectó un rostro frontal claro. Mira directamente a la cámara con buena luz.",
        });
      }

      const fotoDataUrl =
        typeof canvasOrUrl === "string"
          ? canvasOrUrl
          : canvasOrUrl.toDataURL("image/jpeg", 0.85);

      const res = await actualizarBiometriaEmpleado(selectedEmpId, fotoDataUrl, descriptor);
      if (res.ok) {
        setEstadoMsg({
          tipo: "ok",
          texto: "✓ Rostro biométrico (128 dimensiones) guardado correctamente en Supabase.",
        });
        onEnrolled(selectedEmpId, fotoDataUrl, descriptor);
        setTimeout(() => {
          onClose();
        }, 900);
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

    const maxW = 360;
    const scale = video.videoWidth > maxW ? maxW / video.videoWidth : 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    await procesarYGuardarImagen(canvas);
  };

  const handleSubirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const maxW = 360;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        await procesarYGuardarImagen(canvas);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Enrolamiento Biométrico Facial (face-api.js)
            </h3>
            <p className="text-[11px] text-slate-500">
              Registra el vector facial de 128 dimensiones para reconocimiento automático en cámara.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Seleccionar Colaborador *
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 text-slate-900 font-medium"
            >
              {empleados.map((emp) => {
                const tiene = Array.isArray(emp.descripcion_facial) && emp.descripcion_facial.length === 128;
                return (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} {emp.apellido} ({emp.dni}) — {tiene ? "✓ Rostro IA Activo" : "Pendiente"}
                  </option>
                );
              })}
            </select>
          </div>

          {/* PREVIEW WEBCAM */}
          <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
            {streamError ? (
              <p className="text-amber-300 text-xs text-center px-6">{streamError}</p>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
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
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSubirArchivo}
                disabled={procesando}
              />
              📁 Subir Foto Frontal
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={procesando}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleCapturarWebcam}
                disabled={procesando || Boolean(streamError) || !selectedEmpId}
                className="px-4 py-2 rounded-xl bg-[#1D4ED8] hover:bg-blue-700 text-white font-bold disabled:opacity-50 cursor-pointer"
              >
                {procesando ? "Procesando IA..." : "📸 Capturar y Guardar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
