"use client";

import React, { useState, useEffect } from "react";
import {
  TipoFuenteCamara,
  ModoAccesoCamara,
  buildCamaraStreamUrl,
} from "@/models/Camara";

interface VideoDeviceOption {
  deviceId: string;
  label: string;
}

interface AddCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableDevices: VideoDeviceOption[];
  onCrear: (camara: {
    nombre: string;
    punto_acceso: string;
    sede: string;
    resolucion: string;
    stream_url: string;
  }) => Promise<void>;
  guardando: boolean;
}

export default function AddCameraModal({
  isOpen,
  onClose,
  availableDevices,
  onCrear,
  guardando,
}: AddCameraModalProps) {
  const [tipoFuente, setTipoFuente] = useState<TipoFuenteCamara>("IP_HTTP");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [streamInputUrl, setStreamInputUrl] = useState<string>("");
  const [modoAcceso, setModoAcceso] = useState<ModoAccesoCamara>("AUTO");
  const [nombre, setNombre] = useState("");
  const [puntoAcceso, setPuntoAcceso] = useState("");
  const [sede, setSede] = useState("Sede Central");
  const [resolucion, setResolucion] = useState("1080p 30fps");

  useEffect(() => {
    if (availableDevices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(availableDevices[0].deviceId);
    }
  }, [availableDevices, selectedDeviceId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !puntoAcceso.trim()) return;
    if (tipoFuente !== "WEBCAM_LOCAL" && !streamInputUrl.trim()) return;

    const streamUrl = buildCamaraStreamUrl(
      tipoFuente,
      tipoFuente === "WEBCAM_LOCAL" ? selectedDeviceId : streamInputUrl,
      modoAcceso
    );

    await onCrear({
      nombre: nombre.trim(),
      punto_acceso: puntoAcceso.trim().toUpperCase(),
      sede: sede.trim() || "Sede Central",
      resolucion: resolucion.trim(),
      stream_url: streamUrl,
    });

    setNombre("");
    setPuntoAcceso("");
    setStreamInputUrl("");
    onClose();
  };

  const inputClass =
    "w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-hidden focus:border-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              📷
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Vincular Nueva Cámara (USB / Hikvision IP)
              </h3>
              <p className="text-[11px] text-slate-500">
                Conecta cámaras locales adicionales o flujos de red IP.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* SELECTOR DE TIPO DE FUENTE */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Tipo de Conexión de Cámara
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "WEBCAM_LOCAL", label: "USB / Local", desc: "Webcam conectada" },
                { id: "IP_HTTP", label: "IP HTTP / MJPEG", desc: "Hikvision / Celular" },
                { id: "IP_RTSP", label: "IP RTSP", desc: "NVR Hikvision/Dahua" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTipoFuente(t.id as TipoFuenteCamara)}
                  className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                    tipoFuente === t.id
                      ? "bg-slate-900 text-white border-slate-900 font-bold"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="text-[11px]">{t.label}</div>
                  <div className="text-[9px] opacity-75">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {tipoFuente === "WEBCAM_LOCAL" ? (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Dispositivo de Video Detectado ({availableDevices.length})
              </label>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className={inputClass}
              >
                {availableDevices.length === 0 ? (
                  <option value="default">Cámara predeterminada del navegador</option>
                ) : (
                  availableDevices.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Cámara USB #${i + 1}`}
                    </option>
                  ))
                )}
              </select>
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {tipoFuente === "IP_HTTP"
                  ? "URL del Stream HTTP MJPEG *"
                  : "URL RTSP Hikvision / NVR *"}
              </label>
              <input
                type="text"
                required
                value={streamInputUrl}
                onChange={(e) => setStreamInputUrl(e.target.value)}
                placeholder={
                  tipoFuente === "IP_HTTP"
                    ? "Ej: http://192.168.1.64/ISAPI/Streaming/channels/102/httpPreview o http://192.168.1.50:8080/video"
                    : "Ej: rtsp://admin:clave@192.168.1.64:554/Streaming/Channels/101"
                }
                className={inputClass}
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {tipoFuente === "IP_HTTP"
                  ? "Compatible en vivo con face-api.js para cámaras IP MJPEG o app IP Webcam."
                  : "Para flujos RTSP en navegador requiere pasarela WebRTC/MediaMTX en la red local."}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nombre de la Cámara *
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Hikvision Puerta 2"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Punto de Acceso *
              </label>
              <input
                type="text"
                required
                value={puntoAcceso}
                onChange={(e) => setPuntoAcceso(e.target.value)}
                placeholder="Ej: TORNIQUETE B"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Función</label>
              <select
                value={modoAcceso}
                onChange={(e) => setModoAcceso(e.target.value as ModoAccesoCamara)}
                className={inputClass}
              >
                <option value="AUTO">⚡ Auto (E/S)</option>
                <option value="ENTRADA">→ Solo Entrada</option>
                <option value="SALIDA">← Solo Salida</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sede</label>
              <input
                type="text"
                value={sede}
                onChange={(e) => setSede(e.target.value)}
                placeholder="Sede Central"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Resolución</label>
              <select
                value={resolucion}
                onChange={(e) => setResolucion(e.target.value)}
                className={inputClass}
              >
                <option value="1080p 30fps">1080p 30fps</option>
                <option value="720p 30fps">720p 30fps</option>
                <option value="4K 30fps">4K 30fps</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-blue-800 text-white font-bold disabled:opacity-50 cursor-pointer"
            >
              {guardando ? "Guardando..." : "Conectar Cámara"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
