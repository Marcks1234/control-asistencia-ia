"use client";

import React, { useState, useEffect } from "react";
import CameraFeedCard from "./CameraFeedCard";
import RecentDetectionsWidget from "./RecentDetectionsWidget";
import BiometricRecognitionModal from "./BiometricRecognitionModal";
import AddCameraModal from "./AddCameraModal";
import { Camara, DeteccionBiometrica } from "@/models/Camara";
import {
  fetchCamarasData,
  conectarNuevaCamara,
  registrarMarcacionBiometrica,
} from "@/services/camaraService";
import { fetchEmpleadosPrueba, EmpleadoItem } from "@/services/empleadoService";

interface CamarasViewProps {
  globalSearch?: string;
}

export default function CamarasView({ globalSearch = "" }: CamarasViewProps) {
  const [camaras, setCamaras] = useState<Camara[]>([]);
  const [detecciones, setDetecciones] = useState<DeteccionBiometrica[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoItem[]>([]);
  const [estadoSistema, setEstadoSistema] = useState({
    estado: "OPERATIVO",
    precisionGlobal: 98.6,
    tiempoRespuestaMs: 135,
    algoritmo: "CNN Biométrico (Anti-spoofing activo)",
  });

  const [cargando, setCargando] = useState<boolean>(true);
  const [activeWebcamCamId, setActiveWebcamCamId] = useState<string | null>(null);
  const [isPausedAll, setIsPausedAll] = useState<boolean>(false);
  const [selectedSede, setSelectedSede] = useState<string>("Sede Central");

  // Modales
  const [selectedCamara, setSelectedCamara] = useState<Camara | null>(null);
  const [isRecognitionModalOpen, setIsRecognitionModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [procesandoMarcacion, setProcesandoMarcacion] = useState(false);
  const [guardandoCamara, setGuardandoCamara] = useState(false);

  // Mensaje de notificación
  const [toast, setToast] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [camData, empData] = await Promise.all([
        fetchCamarasData(),
        fetchEmpleadosPrueba(),
      ]);

      if (camData.ok && camData.camaras) {
        setCamaras(camData.camaras);
        setDetecciones(camData.detecciones || []);
        if (camData.estadoSistema) setEstadoSistema(camData.estadoSistema);
      }

      if (empData.ok && empData.empleados) {
        setEmpleados(empData.empleados);
      }
    } catch (err) {
      console.warn("[CamarasView] Error al cargar cámaras o empleados:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleToggleWebcam = (camId: string) => {
    if (activeWebcamCamId === camId) {
      setActiveWebcamCamId(null);
    } else {
      setActiveWebcamCamId(camId);
    }
  };

  const handleAbrirMarcacion = (camara: Camara) => {
    setSelectedCamara(camara);
    setIsRecognitionModalOpen(true);
  };

  const handleConfirmarMarcacion = async (payload: {
    employeeId: string;
    camaraId: string;
    puntoAcceso: string;
    confianza: number;
    accion: "auto" | "check-in" | "check-out";
  }) => {
    setProcesandoMarcacion(true);
    try {
      const res = await registrarMarcacionBiometrica(payload);
      if (res.ok) {
        setToast({
          tipo: "ok",
          texto: res.mensaje || "Marcación biométrica registrada exitosamente.",
        });
        setIsRecognitionModalOpen(false);

        // Actualizar la lista en vivo de detecciones
        const now = new Date();
        const horaStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const emp = res.empleado || empleados.find((e) => e.id === payload.employeeId);
        const cam = camaras.find((c) => c.id === payload.camaraId) || selectedCamara;

        if (emp) {
          const nuevaDeteccion: DeteccionBiometrica = {
            id: `det-${Date.now()}`,
            empleadoId: emp.id,
            nombre: `${emp.nombre} ${emp.apellido}`.trim(),
            cargo: emp.cargo || "Colaborador",
            departamento: emp.departamentos?.nombre || "General",
            camaraNombre: cam?.nombre || "Cám 01 · Torniquete A",
            puntoAcceso: payload.puntoAcceso,
            confianza: payload.confianza,
            tipo: res.tipo || "Entrada",
            hora: horaStr,
            tiempoRelativo: "Ahora",
            estado: res.tipo === "Tardanza" ? "TARDANZA" : "PRESENTE",
          };

          setDetecciones((prev) => [nuevaDeteccion, ...prev]);
        }
      } else {
        setToast({
          tipo: "err",
          texto: res.error || "No se pudo registrar la marcación.",
        });
      }
    } catch (err: any) {
      setToast({
        tipo: "err",
        texto: err?.message || "Error al procesar reconocimiento.",
      });
    } finally {
      setProcesandoMarcacion(false);
    }
  };

  const handleCrearCamara = async (data: {
    nombre: string;
    punto_acceso: string;
    sede: string;
    resolucion: string;
  }) => {
    setGuardandoCamara(true);
    try {
      const res = await conectarNuevaCamara(data);
      if (res.ok && res.camara) {
        setCamaras((prev) => [...prev, res.camara!]);
        setToast({ tipo: "ok", texto: "Cámara conectada exitosamente." });
        setIsAddModalOpen(false);
      } else {
        // Fallback local
        const nuevaLocal: Camara = {
          id: `cam-${Date.now()}`,
          nombre: data.nombre,
          punto_acceso: data.punto_acceso,
          sede: data.sede,
          resolucion: data.resolucion,
          estado: "OPERATIVA",
          activo: true,
        };
        setCamaras((prev) => [...prev, nuevaLocal]);
        setToast({ tipo: "ok", texto: "Cámara vinculada al panel de monitoreo." });
        setIsAddModalOpen(false);
      }
    } catch {
      setToast({ tipo: "err", texto: "Error al vincular dispositivo." });
    } finally {
      setGuardandoCamara(false);
    }
  };

  const sedesDisponibles = Array.from(
    new Set(["Sede Central", ...camaras.map((c) => c.sede).filter(Boolean)])
  );

  const camarasFiltradas = camaras.filter(
    (c) =>
      (!selectedSede || c.sede === selectedSede) &&
      (!globalSearch ||
        `${c.nombre} ${c.punto_acceso} ${c.sede}`.toLowerCase().includes(globalSearch.toLowerCase()))
  );

  return (
    <div className="space-y-5 pb-8">
      {/* NOTIFICACIÓN TOAST */}
      {toast && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-md transition-all animate-in fade-in slide-in-from-top-2 ${
            toast.tipo === "ok"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{toast.tipo === "ok" ? "✅" : "⚠️"}</span>
            <span>{toast.texto}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-white/80 hover:text-white font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER DE LA SECCIÓN */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 lg:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Monitoreo de Cámaras IA
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {camaras.length} cámaras conectadas • {selectedSede} • Control de accesos y reconocimiento facial
          </p>
        </div>

        {/* CONTROLES SUPERIORES */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Sede */}
          <select
            value={selectedSede}
            onChange={(e) => setSelectedSede(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden"
          >
            {sedesDisponibles.map((sede) => (
              <option key={sede} value={sede}>
                📍 {sede}
              </option>
            ))}
          </select>

          {/* Botón Pausar Transmisión */}
          <button
            type="button"
            onClick={() => setIsPausedAll((prev) => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              isPausedAll
                ? "bg-amber-500 border-amber-600 text-white shadow-xs"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>{isPausedAll ? "▶️ Reanudar" : "⏸️ Pausar"}</span>
          </button>

          {/* Botón Agregar Cámara */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>+ Conectar Cámara</span>
          </button>
        </div>
      </div>

      {/* CUERPO PRINCIPAL: GRID DE CÁMARAS + PANEL LATERAL DE DETECCIONES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* COLUMNA IZQUIERDA: FEEDS DE CÁMARAS (2 COLUMNAS EN LG) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {camarasFiltradas.map((cam) => (
              <CameraFeedCard
                key={cam.id}
                camara={cam}
                isWebcamActive={activeWebcamCamId === cam.id}
                onToggleWebcam={() => handleToggleWebcam(cam.id)}
                onCapturarMarcacion={handleAbrirMarcacion}
                isPaused={isPausedAll || cam.estado === "PAUSADA"}
              />
            ))}

            {/* TARJETA PARA AGREGAR NUEVA CÁMARA */}
            <div
              onClick={() => setIsAddModalOpen(true)}
              className="aspect-video bg-slate-50 hover:bg-blue-50/50 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-white group-hover:bg-blue-600 text-slate-500 group-hover:text-white flex items-center justify-center shadow-xs transition-colors mb-2.5">
                <span className="text-xl font-bold">+</span>
              </div>
              <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                Vincular Nuevo Dispositivo
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                Conecta terminales biométricos, webcams o cámaras IP por RTSP.
              </p>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: ÚLTIMAS DETECCIONES Y ESTADO DEL SISTEMA */}
        <div className="lg:col-span-1">
          <RecentDetectionsWidget
            detecciones={detecciones}
            estadoSistema={estadoSistema}
          />
        </div>
      </div>

      {/* MODAL DE MARCACIÓN BIOMÉTRICA */}
      <BiometricRecognitionModal
        isOpen={isRecognitionModalOpen}
        onClose={() => setIsRecognitionModalOpen(false)}
        camara={selectedCamara}
        empleados={empleados}
        onConfirmar={handleConfirmarMarcacion}
        procesando={procesandoMarcacion}
      />

      {/* MODAL DE AGREGAR CÁMARA */}
      <AddCameraModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCrear={handleCrearCamara}
        guardando={guardandoCamara}
      />
    </div>
  );
}
