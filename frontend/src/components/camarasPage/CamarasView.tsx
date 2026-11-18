"use client";

import React, { useState, useEffect, useCallback } from "react";
import CameraFeedCard from "./CameraFeedCard";
import RecentDetectionsWidget from "./RecentDetectionsWidget";
import BiometricRecognitionModal from "./BiometricRecognitionModal";
import AddCameraModal from "./AddCameraModal";
import EnrollFaceModal from "./EnrollFaceModal";
import {
  Camara,
  DeteccionBiometrica,
  ModoAccesoCamara,
  buildCamaraStreamUrl,
  parseCamaraStreamMeta,
} from "@/models/Camara";
import {
  fetchCamarasData,
  conectarNuevaCamara,
  actualizarCamara,
  eliminarCamara,
  registrarMarcacionBiometrica,
} from "@/services/camaraService";
import { fetchEmpleadosPrueba, EmpleadoItem } from "@/services/empleadoService";
import {
  EmpleadoConDescriptor,
  loadFaceModels,
  preloadEmployeeDescriptors,
} from "@/lib/faceRecognition";

interface CamarasViewProps {
  globalSearch?: string;
}

interface VideoDeviceOption {
  deviceId: string;
  label: string;
}

export default function CamarasView({ globalSearch = "" }: CamarasViewProps) {
  const [dbCamaras, setDbCamaras] = useState<Camara[]>([]);
  const [localDevices, setLocalDevices] = useState<VideoDeviceOption[]>([]);
  const [localDetectedCamaras, setLocalDetectedCamaras] = useState<Camara[]>([]);
  const [detecciones, setDetecciones] = useState<DeteccionBiometrica[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoItem[]>([]);
  const [modelosCargados, setModelosCargados] = useState<boolean>(false);

  const [estadoSistema, setEstadoSistema] = useState({
    estado: "OPERATIVO",
    precisionGlobal: 98.6,
    tiempoRespuestaMs: 135,
    algoritmo: "face-api.js CNN (68 Landmarks · Descriptor 128D)",
  });

  const [activeStreams, setActiveStreams] = useState<Record<string, boolean>>({});
  const [isPausedAll, setIsPausedAll] = useState<boolean>(false);
  const [selectedSede, setSelectedSede] = useState<string>("Todas las sedes");

  // Modales
  const [selectedCamara, setSelectedCamara] = useState<Camara | null>(null);
  const [isRecognitionModalOpen, setIsRecognitionModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [procesandoMarcacion, setProcesandoMarcacion] = useState(false);
  const [guardandoCamara, setGuardandoCamara] = useState(false);

  const [toast, setToast] = useState<{ tipo: "ok" | "err" | "info"; texto: string } | null>(null);

  const detectarDispositivosLocales = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices
        .filter((d) => d.kind === "videoinput")
        .map((d, idx) => ({
          deviceId: d.deviceId || `default-${idx}`,
          label: d.label || `Cámara Conectada #${idx + 1}`,
        }));

      setLocalDevices(videoInputs);

      const fallbackCams: Camara[] =
        videoInputs.length > 0
          ? videoInputs.map((d, idx) => ({
              id: `local-cam-${idx}-${d.deviceId.slice(0, 8)}`,
              nombre: d.label || `Cámara del Equipo #${idx + 1}`,
              punto_acceso: idx === 0 ? "ENTRADA PRINCIPAL" : `TERMINAL LOCAL ${idx + 1}`,
              sede: "Sede Central",
              resolucion: "1080p 30fps",
              estado: "OPERATIVA",
              tipo_fuente: "WEBCAM_LOCAL",
              device_id: d.deviceId === `default-${idx}` ? undefined : d.deviceId,
              modo_acceso: "AUTO",
              es_detectada_local: true,
              stream_url: buildCamaraStreamUrl("WEBCAM_LOCAL", d.deviceId || "default", "AUTO"),
            }))
          : [
              {
                id: "local-cam-default",
                nombre: "Cámara Principal del Equipo",
                punto_acceso: "ENTRADA PRINCIPAL",
                sede: "Sede Central",
                resolucion: "1080p 30fps",
                estado: "OPERATIVA",
                tipo_fuente: "WEBCAM_LOCAL",
                modo_acceso: "AUTO",
                es_detectada_local: true,
                stream_url: buildCamaraStreamUrl("WEBCAM_LOCAL", "default", "AUTO"),
              },
            ];

      setLocalDetectedCamaras(fallbackCams);
      return fallbackCams;
    } catch {
      return [];
    }
  }, []);

  const cargarDatos = useCallback(async () => {
    try {
      const [camData, empData] = await Promise.all([
        fetchCamarasData(),
        fetchEmpleadosPrueba(),
        detectarDispositivosLocales(),
      ]);

      if (camData.ok) {
        setDbCamaras(camData.camaras || []);
        setDetecciones(camData.detecciones || []);
        if (camData.estadoSistema) setEstadoSistema(camData.estadoSistema);
      }

      if (empData.ok && empData.empleados) {
        setEmpleados(empData.empleados);
        preloadEmployeeDescriptors(empData.empleados as EmpleadoConDescriptor[]);
      }

      const loaded = await loadFaceModels();
      setModelosCargados(loaded);
    } catch (err) {
      console.warn("[CamarasView] Error cargando módulo de cámaras:", err);
    }
  }, [detectarDispositivosLocales]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Si existen cámaras guardadas en Supabase se muestran esas; si no, solo las cámaras físicas detectadas en este equipo
  const camarasVisibles = dbCamaras.length > 0 ? dbCamaras : localDetectedCamaras;

  const handleToggleStream = async (camId: string) => {
    const nextActive = !activeStreams[camId];
    setActiveStreams((prev) => ({ ...prev, [camId]: nextActive }));
    if (nextActive) {
      // Refrescar etiquetas de dispositivos una vez otorgado permiso
      setTimeout(() => detectarDispositivosLocales(), 800);
    }
  };

  const registrarEnServidor = async (payload: {
    employeeId: string;
    camaraId: string;
    puntoAcceso: string;
    confianza: number;
    accion: "auto" | "check-in" | "check-out";
  }) => {
    const res = await registrarMarcacionBiometrica({
      employeeId: payload.employeeId,
      id_camara: payload.camaraId,
      punto_acceso: payload.puntoAcceso,
      confianza_ia: payload.confianza,
      accion: payload.accion,
    });

    if (res.ok) {
      if (res.yaRegistrado) {
        setToast({ tipo: "info", texto: res.mensaje || "Marcación ya registrada previamente." });
        return res;
      }

      setToast({
        tipo: "ok",
        texto: res.mensaje || "Marcación biométrica guardada en Supabase.",
      });

      const now = new Date();
      const horaStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const emp = res.empleado || empleados.find((e) => e.id === payload.employeeId);
      const cam = camarasVisibles.find((c) => c.id === payload.camaraId);

      if (emp) {
        const nuevaDeteccion: DeteccionBiometrica = {
          id: `det-${Date.now()}`,
          empleadoId: emp.id,
          nombre: `${emp.nombre} ${emp.apellido}`.trim(),
          cargo: emp.cargo || "Colaborador",
          departamento: emp.departamentos?.nombre || "General",
          foto_url: emp.foto_url || null,
          camaraNombre: cam?.nombre || payload.puntoAcceso,
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
        texto: res.error || "No se pudo guardar la marcación.",
      });
    }
    return res;
  };

  const handleAutoRecognition = useCallback(
    async (
      empleado: EmpleadoConDescriptor,
      camara: Camara,
      confianza: number,
      modo: ModoAccesoCamara
    ) => {
      const accion =
        modo === "ENTRADA" ? "check-in" : modo === "SALIDA" ? "check-out" : "auto";
      await registrarEnServidor({
        employeeId: empleado.id,
        camaraId: camara.id,
        puntoAcceso: `${camara.nombre} · ${camara.punto_acceso}`,
        confianza,
        accion,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [empleados, camarasVisibles]
  );

  const handleConfirmarModalManual = async (payload: {
    employeeId: string;
    camaraId: string;
    puntoAcceso: string;
    confianza: number;
    accion: "auto" | "check-in" | "check-out";
  }) => {
    setProcesandoMarcacion(true);
    try {
      const res = await registrarEnServidor(payload);
      if (res.ok) setIsRecognitionModalOpen(false);
    } finally {
      setProcesandoMarcacion(false);
    }
  };

  const handleCambiarModoCamara = async (camara: Camara, nuevoModo: ModoAccesoCamara) => {
    const meta = parseCamaraStreamMeta(camara.stream_url);
    const nuevoStreamUrl = buildCamaraStreamUrl(
      camara.tipo_fuente || meta.tipo_fuente,
      camara.device_id || meta.urlLimpia || "default",
      nuevoModo
    );

    const actualizarLista = (lista: Camara[]) =>
      lista.map((c) =>
        c.id === camara.id ? { ...c, modo_acceso: nuevoModo, stream_url: nuevoStreamUrl } : c
      );

    if (dbCamaras.length > 0) {
      setDbCamaras(actualizarLista);
      await actualizarCamara({ id: camara.id, stream_url: nuevoStreamUrl });
    } else {
      setLocalDetectedCamaras(actualizarLista);
    }
  };

  const handleCrearCamara = async (data: {
    nombre: string;
    punto_acceso: string;
    sede: string;
    resolucion: string;
    stream_url: string;
  }) => {
    setGuardandoCamara(true);
    try {
      const res = await conectarNuevaCamara(data);
      if (res.ok && res.camara) {
        setDbCamaras((prev) => [...prev, res.camara!]);
        setToast({ tipo: "ok", texto: `Cámara "${data.nombre}" conectada y guardada.` });
        setIsAddModalOpen(false);
      } else {
        setToast({ tipo: "err", texto: res.error || "No se pudo guardar la cámara." });
      }
    } catch {
      setToast({ tipo: "err", texto: "Error de red al guardar cámara." });
    } finally {
      setGuardandoCamara(false);
    }
  };

  const handleEliminarCamara = async (camara: Camara) => {
    if (!window.confirm(`¿Desvincular cámara "${camara.nombre}"?`)) return;
    const res = await eliminarCamara(camara.id);
    if (res.ok) {
      setDbCamaras((prev) => prev.filter((c) => c.id !== camara.id));
      setToast({ tipo: "info", texto: `Cámara "${camara.nombre}" desvinculada.` });
    } else {
      setToast({ tipo: "err", texto: res.error || "No se pudo eliminar la cámara." });
    }
  };

  const handleEnrolledFace = (empId: string, fotoUrl: string, descriptor: number[]) => {
    setEmpleados((prev) =>
      prev.map((e) =>
        e.id === empId ? { ...e, foto_url: fotoUrl, descripcion_facial: descriptor } : e
      )
    );
    setToast({
      tipo: "ok",
      texto: "Rostro enrolado. Enciende la cámara para probar el reconocimiento automático.",
    });
  };

  const sedesDisponibles = Array.from(
    new Set(["Todas las sedes", ...camarasVisibles.map((c) => c.sede).filter(Boolean)])
  );

  const camarasFiltradas = camarasVisibles.filter(
    (c) =>
      (selectedSede === "Todas las sedes" || c.sede === selectedSede) &&
      (!globalSearch ||
        `${c.nombre} ${c.punto_acceso} ${c.sede}`
          .toLowerCase()
          .includes(globalSearch.toLowerCase()))
  );

  const enroladosCount = empleados.filter(
    (e) =>
      (Array.isArray(e.descripcion_facial) && e.descripcion_facial.length === 128) ||
      Boolean(e.foto_url)
  ).length;

  return (
    <div className="space-y-5 pb-8">
      {/* NOTIFICACIÓN TOAST */}
      {toast && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-md transition-all ${
            toast.tipo === "ok"
              ? "bg-emerald-600 text-white"
              : toast.tipo === "info"
              ? "bg-blue-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{toast.tipo === "ok" ? "✅" : toast.tipo === "info" ? "ℹ️" : "⚠️"}</span>
            <span>{toast.texto}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-white/80 hover:text-white font-bold px-2 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER DE LA SECCIÓN */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 lg:p-5 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Monitoreo de Cámaras IA
            </h1>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                modelosCargados
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {modelosCargados ? "✓ face-api.js CNN Activo" : "Cargando modelos IA..."}
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {enroladosCount} / {empleados.length} rostros enrolados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {camarasFiltradas.length}{" "}
            {camarasFiltradas.length === 1 ? "cámara conectada" : "cámaras conectadas"} •{" "}
            {dbCamaras.length === 0 ? "Detectada automáticamente en este equipo" : selectedSede}
          </p>
        </div>

        {/* CONTROLES SUPERIORES */}
        <div className="flex flex-wrap items-center gap-2">
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

          <button
            type="button"
            onClick={() => setIsEnrollModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>👤 Registrar Rostro IA</span>
          </button>

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

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>+ Conectar Cámara</span>
          </button>
        </div>
      </div>

      {enroladosCount === 0 && empleados.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>
            <strong>Paso inicial requerido:</strong> Ningún colaborador tiene su rostro enrolado todavía. Registra al menos una foto facial para que la cámara reconozca automáticamente la entrada y salida.
          </span>
          <button
            type="button"
            onClick={() => setIsEnrollModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer"
          >
            Enrolar Primer Rostro
          </button>
        </div>
      )}

      {/* CUERPO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {camarasFiltradas.map((cam) => (
              <CameraFeedCard
                key={cam.id}
                camara={cam}
                empleados={empleados as EmpleadoConDescriptor[]}
                isStreamActive={Boolean(activeStreams[cam.id])}
                onToggleStream={() => handleToggleStream(cam.id)}
                onCapturarMarcacion={(c) => {
                  setSelectedCamara(c);
                  setIsRecognitionModalOpen(true);
                }}
                onAutoRecognition={handleAutoRecognition}
                onCambiarModo={handleCambiarModoCamara}
                onEliminarCamara={handleEliminarCamara}
                isPaused={isPausedAll || cam.estado === "PAUSADA"}
              />
            ))}

            {/* TARJETA PARA AGREGAR MÁS CÁMARAS (USB / HIKVISION / IP) */}
            <div
              onClick={() => setIsAddModalOpen(true)}
              className="aspect-video bg-slate-50 hover:bg-blue-50/50 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-white group-hover:bg-blue-600 text-slate-500 group-hover:text-white flex items-center justify-center shadow-xs transition-colors mb-2.5">
                <span className="text-xl font-bold">+</span>
              </div>
              <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                Conectar Cámara Adicional (Hikvision / IP / USB)
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                Agrega cámaras USB adicionales o flujos de cámaras IP en red (HTTP MJPEG / RTSP).
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <RecentDetectionsWidget
            detecciones={detecciones}
            estadoSistema={estadoSistema}
          />
        </div>
      </div>

      {/* MODALES */}
      <EnrollFaceModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        empleados={empleados}
        onEnrolled={handleEnrolledFace}
      />

      <BiometricRecognitionModal
        isOpen={isRecognitionModalOpen}
        onClose={() => setIsRecognitionModalOpen(false)}
        camara={selectedCamara}
        empleados={empleados}
        onConfirmar={handleConfirmarModalManual}
        procesando={procesandoMarcacion}
      />

      <AddCameraModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        availableDevices={localDevices}
        onCrear={handleCrearCamara}
        guardando={guardandoCamara}
      />
    </div>
  );
}
