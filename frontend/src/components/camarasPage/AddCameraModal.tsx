"use client";

import React, { useState } from "react";

interface AddCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCrear: (camara: {
    nombre: string;
    punto_acceso: string;
    sede: string;
    resolucion: string;
  }) => Promise<void>;
  guardando: boolean;
}

export default function AddCameraModal({
  isOpen,
  onClose,
  onCrear,
  guardando,
}: AddCameraModalProps) {
  const [nombre, setNombre] = useState("");
  const [puntoAcceso, setPuntoAcceso] = useState("");
  const [sede, setSede] = useState("Sede Central");
  const [resolucion, setResolucion] = useState("1080p 30fps");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !puntoAcceso.trim()) return;
    await onCrear({
      nombre: nombre.trim(),
      punto_acceso: puntoAcceso.trim(),
      sede: sede.trim(),
      resolucion: resolucion.trim(),
    });
    setNombre("");
    setPuntoAcceso("");
    onClose();
  };

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-hidden focus:border-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              📷
            </div>
            <h3 className="font-bold text-slate-900 text-base">Vincular Nueva Cámara IA</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nombre de la Cámara *
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Cám 04 · Entrada Secundaria"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Punto de Acceso / Ubicación *
            </label>
            <input
              type="text"
              required
              value={puntoAcceso}
              onChange={(e) => setPuntoAcceso(e.target.value)}
              placeholder="Ej: PUERTA 2, ALMACÉN, TORNIQUETE C"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              <label className="block font-semibold text-slate-700 mb-1">Resolución / FPS</label>
              <select
                value={resolucion}
                onChange={(e) => setResolucion(e.target.value)}
                className={inputClass}
              >
                <option value="1080p 30fps">1080p 30fps</option>
                <option value="1080p 60fps">1080p 60fps</option>
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
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-blue-800 text-white font-bold disabled:opacity-50"
            >
              {guardando ? "Conectando..." : "Conectar Dispositivo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
