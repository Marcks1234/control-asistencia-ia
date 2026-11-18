"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camara, ModoAccesoCamara, parseCamaraStreamMeta } from "@/models/Camara";
import { EmpleadoConDescriptor, FaceMatchResult, loadFaceModels, matchFaceInFrame } from "@/lib/faceRecognition";

interface CameraFeedCardProps {
  camara: Camara;
  empleados: EmpleadoConDescriptor[];
  isStreamActive: boolean;
  onToggleStream: () => void;
  onCapturarMarcacion: (camara: Camara) => void;
  onAutoRecognition: (empleado: EmpleadoConDescriptor, camara: Camara, confianza: number, modo: ModoAccesoCamara) => void;
  onCambiarModo: (camara: Camara, nuevoModo: ModoAccesoCamara) => void;
  onEliminarCamara?: (camara: Camara) => void;
  isPaused: boolean;
}

const MODOS: { id: ModoAccesoCamara; label: string; activeClass: string }[] = [
  { id: "ENTRADA", label: "Entrada", activeClass: "bg-emerald-600 text-white" },
  { id: "SALIDA", label: "Salida", activeClass: "bg-blue-600 text-white" },
  { id: "AUTO", label: "Auto", activeClass: "bg-indigo-600 text-white" },
];

function drawDetectionsOnCanvas(ctx: CanvasRenderingContext2D, srcW: number, results: FaceMatchResult[]) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (const det of results) {
    const matched = det.empleadoMatch;
    const color = matched ? "#10B981" : "#F59E0B";

    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, Math.round(srcW / 320));
    ctx.strokeRect(det.box.x, det.box.y, det.box.width, det.box.height);

    ctx.fillStyle = color;
    for (const pt of det.landmarks) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    const label = matched
      ? `${matched.nombre} ${matched.apellido} · ${det.confianzaPorcentaje}%`
      : `Rostro no registrado · ${det.confianzaPorcentaje}%`;

    ctx.font = `bold ${Math.max(12, Math.round(srcW / 42))}px sans-serif`;
    const textW = ctx.measureText(label).width;
    const labelY = Math.max(22, det.box.y - 6);
    ctx.fillStyle = matched ? "rgba(6, 95, 70, 0.9)" : "rgba(146, 64, 14, 0.9)";
    ctx.fillRect(det.box.x, labelY - 18, textW + 14, 22);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(label, det.box.x + 7, labelY - 3);
  }
}

export default function CameraFeedCard({
  camara,
  empleados,
  isStreamActive,
  onToggleStream,
  onCapturarMarcacion,
  onAutoRecognition,
  onCambiarModo,
  onEliminarCamara,
  isPaused,
}: CameraFeedCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [streamError, setStreamError] = useState<string | null>(null);
  const [timeString, setTimeString] = useState("");
  const [faceStatus, setFaceStatus] = useState("Esperando activación");
  const [lastMatchBadge, setLastMatchBadge] = useState<string | null>(null);

  const empleadosRef = useRef(empleados);
  empleadosRef.current = empleados;
  const camaraRef = useRef(camara);
  camaraRef.current = camara;
  const onAutoRef = useRef(onAutoRecognition);
  onAutoRef.current = onAutoRecognition;

  const consecutiveRef = useRef<{ empId: string; count: number }>({ empId: "", count: 0 });
  const cooldownMapRef = useRef<Map<string, number>>(new Map());

  const meta = parseCamaraStreamMeta(camara.stream_url);
  const tipoFuente = camara.tipo_fuente || meta.tipo_fuente;
  const modoActual: ModoAccesoCamara = camara.modo_acceso || meta.modo_acceso || "AUTO";
  const deviceIdObjetivo = camara.device_id || meta.device_id;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString([now.getHours(), now.getMinutes(), now.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let cancelled = false;

    if (isStreamActive && !isPaused && tipoFuente === "WEBCAM_LOCAL") {
      setStreamError(null);
      setFaceStatus("Iniciando cámara...");
      const video: MediaTrackConstraints = deviceIdObjetivo
        ? { deviceId: { exact: deviceIdObjetivo }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } };

      navigator.mediaDevices
        ?.getUserMedia({ video, audio: false })
        .then((mediaStream) => {
          if (cancelled) return mediaStream.getTracks().forEach((t) => t.stop());
          activeStream = mediaStream;
          if (videoRef.current) videoRef.current.srcObject = mediaStream;
        })
        .catch((err) => {
          if (!cancelled) {
            setStreamError(
              err.name === "NotAllowedError"
                ? "Permiso de cámara denegado en el navegador."
                : "No se pudo abrir este dispositivo de video. Verifica si otra pestaña lo está usando."
            );
          }
        });
    } else if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }

    return () => {
      cancelled = true;
      activeStream?.getTracks().forEach((t) => t.stop());
    };
  }, [isStreamActive, isPaused, tipoFuente, deviceIdObjetivo]);

  useEffect(() => {
    if (!isStreamActive || isPaused || tipoFuente === "IP_RTSP") {
      canvasRef.current?.getContext("2d")?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      return;
    }

    let running = true;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const runDetectionLoop = async () => {
      if (!running) return;
      await loadFaceModels();
      if (!running) return;

      const sourceEl = tipoFuente === "WEBCAM_LOCAL" ? videoRef.current : imgRef.current;
      const canvas = canvasRef.current;
      const isReady =
        sourceEl &&
        (sourceEl instanceof HTMLVideoElement ? sourceEl.readyState >= 2 && sourceEl.videoWidth > 0 : sourceEl.complete && sourceEl.naturalWidth > 0);

      if (sourceEl && canvas && isReady) {
        const srcW = sourceEl instanceof HTMLVideoElement ? sourceEl.videoWidth : sourceEl.naturalWidth;
        const srcH = sourceEl instanceof HTMLVideoElement ? sourceEl.videoHeight : sourceEl.naturalHeight;
        if (canvas.width !== srcW || canvas.height !== srcH) {
          canvas.width = srcW;
          canvas.height = srcH;
        }

        const results = await matchFaceInFrame(sourceEl, empleadosRef.current, 0.55);
        if (!running) return;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          drawDetectionsOnCanvas(ctx, srcW, results);
          const primaryMatch = results.find((r) => r.empleadoMatch);

          if (results.length === 0) {
            setFaceStatus("Buscando rostro...");
            consecutiveRef.current = { empId: "", count: 0 };
          } else if (primaryMatch?.empleadoMatch) {
            const emp = primaryMatch.empleadoMatch;
            const modo = camaraRef.current.modo_acceso || modoActual;
            setFaceStatus(`Reconocido: ${emp.nombre} (${primaryMatch.confianzaPorcentaje}%)`);

            consecutiveRef.current =
              consecutiveRef.current.empId === emp.id ? { empId: emp.id, count: consecutiveRef.current.count + 1 } : { empId: emp.id, count: 1 };

            if (consecutiveRef.current.count >= 2) {
              const cooldownKey = `${emp.id}-${modo}`;
              const nowMs = Date.now();
              if (nowMs - (cooldownMapRef.current.get(cooldownKey) || 0) >= 15000) {
                cooldownMapRef.current.set(cooldownKey, nowMs);
                setLastMatchBadge(`${emp.nombre} ${emp.apellido} (${primaryMatch.confianzaPorcentaje}%)`);
                setTimeout(() => setLastMatchBadge(null), 5000);
                onAutoRef.current(emp, camaraRef.current, primaryMatch.confianzaPorcentaje, modo);
              }
            }
          } else {
            consecutiveRef.current = { empId: "", count: 0 };
            setFaceStatus("Rostro detectado sin enrolar");
          }
        }
      }

      if (running) timerId = setTimeout(runDetectionLoop, 280);
    };

    runDetectionLoop();
    return () => {
      running = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [isStreamActive, isPaused, tipoFuente, modoActual]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col transition-all">
      <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isPaused ? "bg-amber-500" : isStreamActive ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`} />
          <h3 className="font-bold text-white tracking-wide truncate">{camara.nombre}</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono shrink-0">
            {tipoFuente === "WEBCAM_LOCAL" ? "USB/LOCAL" : tipoFuente === "IP_HTTP" ? "IP HTTP" : "RTSP"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">{timeString}</span>
          {onEliminarCamara && !camara.es_detectada_local && (
            <button type="button" onClick={() => onEliminarCamara(camara)} title="Desvincular cámara" className="text-[11px] text-slate-400 hover:text-red-400 px-1.5 py-0.5 rounded hover:bg-slate-800 cursor-pointer">
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden select-none">
        {isStreamActive && !isPaused ? (
          tipoFuente === "WEBCAM_LOCAL" ? (
            streamError ? (
              <div className="p-6 text-center text-red-400 text-xs max-w-sm space-y-2">
                <p className="font-semibold">{streamError}</p>
                <button type="button" onClick={onToggleStream} className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] cursor-pointer">
                  Reintentar / Apagar
                </button>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none z-20" />
              </div>
            )
          ) : tipoFuente === "IP_HTTP" ? (
            <div className="relative w-full h-full">
              <img
                ref={imgRef}
                src={meta.urlLimpia}
                crossOrigin="anonymous"
                alt={camara.nombre}
                onError={() => setStreamError("No se puede cargar el stream HTTP MJPEG (verifica IP/CORS o red local).")}
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none z-20" />
              {streamError && (
                <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center text-amber-300 text-xs z-30">
                  <p className="font-bold">Stream IP no accesible desde este navegador</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">{streamError}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 text-center text-slate-300 text-xs space-y-2 max-w-sm">
              <div className="w-10 h-10 mx-auto rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">IP</div>
              <p className="font-bold text-white">Flujo RTSP Corporativo Configurado</p>
              <p className="text-[10px] font-mono text-slate-400 break-all bg-slate-950 px-2 py-1 rounded border border-slate-800">{meta.urlLimpia}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Los navegadores no reproducen RTSP directo. Para ver video en vivo desde una cámara Hikvision, usa su endpoint HTTP MJPEG o un gateway WebRTC/MediaMTX en la red local.
              </p>
            </div>
          )
        ) : (
          <div className="relative w-full h-full bg-radial from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center p-4 text-center">
            <div className="w-24 h-28 border border-slate-700/60 rounded-xl flex items-center justify-center relative">
              <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="absolute top-1 left-1 w-2.5 h-2.5 border-t border-l border-blue-400" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 border-t border-r border-blue-400" />
              <span className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b border-l border-blue-400" />
              <span className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b border-r border-blue-400" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 mt-2">{isPaused ? "Transmisión Pausada" : "Cámara en espera"}</span>
            <button type="button" onClick={onToggleStream} className="mt-2.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow cursor-pointer">
              Encender Cámara
            </button>
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono border border-slate-700/60">
          <span className={`w-1.5 h-1.5 rounded-full ${isStreamActive && !isPaused ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
          <span className="text-slate-200">{isStreamActive && !isPaused ? faceStatus : "EN ESPERA"}</span>
        </div>

        <div className="absolute top-2.5 right-2.5 z-30 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-slate-300 font-mono border border-slate-800">
          {camara.punto_acceso}
        </div>

        {lastMatchBadge && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 bg-emerald-600/95 text-white px-3 py-1 rounded-full text-[11px] font-bold shadow-lg whitespace-nowrap animate-pulse">
            Marcado: {lastMatchBadge}
          </div>
        )}
      </div>

      <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          {MODOS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onCambiarModo(camara, m.id)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                modoActual === m.id ? m.activeClass : "text-slate-400 hover:text-white"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleStream}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              isStreamActive ? "bg-red-600 hover:bg-red-700 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            }`}
          >
            {isStreamActive ? "Apagar" : "Encender"}
          </button>
          <button
            type="button"
            onClick={() => onCapturarMarcacion(camara)}
            className="px-2.5 py-1.5 rounded-lg bg-[#1D4ED8] hover:bg-blue-600 text-white font-bold text-[11px] transition-all cursor-pointer"
            title="Marcar asistencia manualmente en esta cámara"
          >
            Manual
          </button>
        </div>
      </div>
    </div>
  );
}
