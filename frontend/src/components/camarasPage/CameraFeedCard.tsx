"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camara } from "@/models/Camara";

interface CameraFeedCardProps {
  camara: Camara;
  isWebcamActive: boolean;
  onToggleWebcam: () => void;
  onCapturarMarcacion: (camara: Camara) => void;
  isPaused: boolean;
}

export default function CameraFeedCard({
  camara,
  isWebcamActive,
  onToggleWebcam,
  onCapturarMarcacion,
  isPaused,
}: CameraFeedCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [timeString, setTimeString] = useState<string>("");

  // Reloj de tiempo real estilo CCTV (HH:MM:SS)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Manejo de la cámara web real (getUserMedia)
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    if (isWebcamActive) {
      navigator.mediaDevices
        ?.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: false,
        })
        .then((mediaStream) => {
          activeStream = mediaStream;
          setStream(mediaStream);
          setWebcamError(null);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch((err) => {
          console.warn("[CameraFeed] No se pudo acceder a la webcam:", err);
          setWebcamError(
            err.name === "NotAllowedError"
              ? "Permiso de cámara denegado en el navegador."
              : "No se detectó cámara web física disponible."
          );
        });
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isWebcamActive]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col group transition-all">
      {/* HEADER DE LA CÁMARA */}
      <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isPaused
                ? "bg-amber-500"
                : camara.estado === "OPERATIVA"
                ? "bg-emerald-500 animate-pulse"
                : "bg-red-500"
            }`}
          />
          <h3 className="font-bold text-white tracking-wide">{camara.nombre}</h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            {timeString}
          </span>
          <span className="text-[10px] font-bold text-slate-300 uppercase bg-slate-800 px-2 py-0.5 rounded">
            {camara.resolucion || "1080p 30fps"}
          </span>
        </div>
      </div>

      {/* ÁREA DE VISUALIZACIÓN / STREAM */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden select-none">
        {/* LÍNEAS DE ESCANEO CCTV */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] z-10 opacity-30" />

        {isWebcamActive ? (
          webcamError ? (
            <div className="p-6 text-center text-red-400 text-xs max-w-sm space-y-2">
              <span className="text-2xl">⚠️</span>
              <p className="font-semibold">{webcamError}</p>
              <button
                type="button"
                onClick={onToggleWebcam}
                className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px]"
              >
                Volver a Modo Simulación
              </button>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* RETÍCULA BIOMÉTRICA DE RECONOCIMIENTO */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                <div className="relative w-48 h-56 border-2 border-dashed border-emerald-400/80 rounded-2xl flex flex-col justify-between p-2 shadow-[0_0_25px_rgba(52,211,153,0.3)]">
                  {/* Esquinas guía */}
                  <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                  <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

                  {/* Línea láser de escaneo animada */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce opacity-80" />

                  <div className="bg-slate-950/80 backdrop-blur-xs text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded text-center border border-emerald-500/30">
                    SCANNER IA: 98.9%
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          /* MODO VISTA CCTV SIMULADA REALISTA */
          <div className="relative w-full h-full bg-radial from-slate-900 via-slate-950 to-black flex items-center justify-center">
            {/* Silueta de reconocimiento / Punto de acceso */}
            <div className="relative flex flex-col items-center justify-center text-slate-600">
              <div className="w-32 h-40 border border-slate-700/60 rounded-xl flex items-center justify-center relative p-3">
                <svg className="w-16 h-16 text-slate-700 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>

                {/* Retícula de detección */}
                <span className="absolute top-1 left-1 w-3 h-3 border-t border-l border-blue-400" />
                <span className="absolute top-1 right-1 w-3 h-3 border-t border-r border-blue-400" />
                <span className="absolute bottom-1 left-1 w-3 h-3 border-b border-l border-blue-400" />
                <span className="absolute bottom-1 right-1 w-3 h-3 border-b border-r border-blue-400" />
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-2 uppercase tracking-widest">
                Detección Facial Lista
              </span>
            </div>

            {/* Badges en esquinas del video */}
            <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-emerald-400 font-mono border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE FEED
            </div>

            <div className="absolute top-2.5 right-2.5 z-20 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-slate-300 font-mono border border-slate-800">
              {camara.punto_acceso}
            </div>
          </div>
        )}

        {/* OVERLAY DE ESTADO PAUSADO */}
        {isPaused && (
          <div className="absolute inset-0 z-30 bg-black/75 flex items-center justify-center text-white text-xs font-bold gap-2">
            <span>⏸️</span> Transmisión Pausada
          </div>
        )}
      </div>

      {/* FOOTER Y CONTROLES DE LA CÁMARA */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400">
            {camara.sede || "Sede Central"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleWebcam}
            title={isWebcamActive ? "Desactivar cámara web" : "Probar con cámara web real"}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              isWebcamActive
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            }`}
          >
            <span>{isWebcamActive ? "⏹️ Detener WebCam" : "📹 Usar WebCam"}</span>
          </button>

          <button
            type="button"
            onClick={() => onCapturarMarcacion(camara)}
            className="px-3.5 py-1.5 rounded-lg bg-[#1D4ED8] hover:bg-blue-600 text-white font-bold text-xs transition-all shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <span>⚡ Marcar con IA</span>
          </button>
        </div>
      </div>
    </div>
  );
}
