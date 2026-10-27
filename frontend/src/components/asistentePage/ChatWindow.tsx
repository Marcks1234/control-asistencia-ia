"use client";

import { useEffect, useRef, useState } from "react";
import { InteraccionChat, ResumenAsistenciaDia } from "@/types/asistente";
import {
  enviarConsultaAsistente,
  fetchEstadoAsistente,
  limpiarHistorialAsistente,
} from "@/services/asistenteService";
import TarjetaEmpleadoTardanza from "./TarjetaEmpleadoTardanza";

interface ChatWindowProps {
  externalPrompt?: string | null;
  onExternalPromptHandled?: () => void;
}

function formatearHoraMensaje(isoDate?: string): string {
  try {
    const fecha = isoDate ? new Date(isoDate) : new Date();
    if (isNaN(fecha.getTime())) {
      return new Date().toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
    return fecha.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "Ahora";
  }
}

export default function ChatWindow({
  externalPrompt,
  onExternalPromptHandled,
}: ChatWindowProps) {
  const [resumen, setResumen] = useState<ResumenAsistenciaDia>({
    presentes: 3,
    tardanzas: 1,
    ausentes: 1,
  });
  const [cargandoResumen, setCargandoResumen] = useState(true);
  const [historial, setHistorial] = useState<InteraccionChat[]>([]);
  const [inputMensaje, setInputMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [horaSaludo, setHoraSaludo] = useState<string>("08:00 AM");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar conteo real de Supabase e historial al montar
  useEffect(() => {
    setHoraSaludo(formatearHoraMensaje());
    let cancelado = false;
    fetchEstadoAsistente().then((data) => {
      if (cancelado) return;
      setResumen(data.resumen);
      if (data.historial && data.historial.length > 0) {
        setHistorial(data.historial);
      }
      setCargandoResumen(false);
    });
    return () => {
      cancelado = true;
    };
  }, []);

  // Si viene una pregunta desde el TopBar
  useEffect(() => {
    if (externalPrompt && !enviando) {
      manejarEnvioConsulta(externalPrompt);
      onExternalPromptHandled?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPrompt]);

  // Auto-scroll al final del chat al haber mensajes nuevos
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [historial, enviando]);

  const manejarEnvioConsulta = async (textoConsulta?: string) => {
    const valorActualInput = inputRef.current?.value || "";
    const consultaFinal = (textoConsulta ?? (inputMensaje || valorActualInput)).trim();
    if (!consultaFinal || enviando) return;

    // Limpiar input inmediatamente
    setInputMensaje("");
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
    setEnviando(true);

    // 1. Inserción optimista del mensaje del usuario
    const tempId = `temp-${Date.now()}`;
    const itemOptimista: InteraccionChat = {
      id: tempId,
      mensaje: consultaFinal,
      respuesta: "",
      fecha: new Date().toISOString(),
    };
    setHistorial((prev) => [...prev, itemOptimista]);

    // 2. Consulta real a OpenAI / Base de datos Supabase
    try {
      const nuevaInteraccion = await enviarConsultaAsistente(consultaFinal);
      setHistorial((prev) =>
        prev.map((item) => (item.id === tempId ? nuevaInteraccion : item))
      );
    } catch {
      setHistorial((prev) =>
        prev.map((item) =>
          item.id === tempId
            ? {
                ...item,
                respuesta:
                  "No se pudo completar la consulta en este momento. Por favor intenta nuevamente.",
              }
            : item
        )
      );
    } finally {
      setEnviando(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const manejarLimpiarChat = async () => {
    await limpiarHistorialAsistente();
    setHistorial([]);
    inputRef.current?.focus();
  };

  const sugerenciasRapidas = [
    {
      texto: "¿Quién llegó tarde hoy?",
      pregunta: "¿Quién llegó tarde hoy y cuál es el motivo?",
      icono: (
        <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
        </svg>
      ),
    },
    {
      texto: "Ver reporte de Operaciones",
      pregunta: "Ver reporte de Operaciones",
      icono: (
        <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
      ),
    },
    {
      texto: "Generar resumen del día",
      pregunta: "Generar resumen del día",
      icono: (
        <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6M16 13H8M16 17H8" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col px-8 py-6 max-w-6xl w-full mx-auto">
      {/* Encabezado de la vista */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Asistente Inteligente IA
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Consultas en tiempo real sobre asistencia, puntualidad y métricas del personal.
          </p>
        </div>

        <button
          type="button"
          onClick={manejarLimpiarChat}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v5h5" />
          </svg>
          <span>Limpiar chat</span>
        </button>
      </div>

      {/* Contenedor principal del Chat */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between overflow-hidden min-h-[540px]">
        {/* Área de mensajes */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[600px]">
          {/* Mensaje inicial de bienvenida conectado a los conteos reales de Supabase */}
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#1D63ED] text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                />
              </svg>
            </div>

            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">AsistenciaAI</span>
                <span className="text-[11px] text-slate-400" suppressHydrationWarning>
                  {horaSaludo}
                </span>
              </div>

              <div className="bg-slate-100/80 border border-slate-200/50 rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-slate-700 leading-relaxed">
                {cargandoResumen ? (
                  <span>Consultando asistencias en la base de datos...</span>
                ) : (
                  <>
                    Hola Sarah, hoy tenemos{" "}
                    <span className="font-bold text-emerald-600">
                      {resumen.presentes} {resumen.presentes === 1 ? "presente" : "presentes"}
                    </span>
                    ,{" "}
                    <span className="font-bold text-amber-600">
                      {resumen.tardanzas} {resumen.tardanzas === 1 ? "tardanza" : "tardanzas"}
                    </span>{" "}
                    y{" "}
                    <span className="font-bold text-red-600">
                      {resumen.ausentes} {resumen.ausentes === 1 ? "ausente" : "ausentes"}
                    </span>{" "}
                    registrados en la base de datos. ¿En qué te puedo ayudar?
                  </>
                )}
              </div>

              {/* Chips de sugerencias rápidas */}
              <div className="flex flex-wrap gap-2 pt-0.5">
                {sugerenciasRapidas.map((chip) => (
                  <button
                    key={chip.texto}
                    type="button"
                    onClick={() => manejarEnvioConsulta(chip.pregunta)}
                    disabled={enviando}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-[11px] font-semibold text-slate-700 transition cursor-pointer disabled:opacity-50"
                  >
                    {chip.icono}
                    <span>{chip.texto}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lista de mensajes */}
          {historial.map((item) => {
            const horaFormateada = formatearHoraMensaje(item.fecha);
            return (
              <div key={item.id} className="space-y-5">
                {/* Mensaje del usuario (Sarah Miller) a la derecha */}
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] text-slate-400" suppressHydrationWarning>
                      {horaFormateada}
                    </span>
                    <span className="text-xs font-bold text-slate-800">Sarah Miller</span>
                    <div className="w-6 h-6 rounded-full bg-linear-to-tr from-amber-700 to-amber-500 text-white font-bold text-[10px] flex items-center justify-center">
                      SM
                    </div>
                  </div>
                  <div className="bg-[#1D63ED] text-white text-xs font-medium px-4 py-3 rounded-2xl rounded-tr-sm max-w-md shadow-xs whitespace-pre-wrap leading-relaxed">
                    {item.mensaje}
                  </div>
                </div>

                {/* Respuesta de AsistenciaAI a la izquierda */}
                {item.respuesta ? (
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#1D63ED] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                        />
                      </svg>
                    </div>

                    <div className="space-y-2.5 max-w-2xl flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">AsistenciaAI</span>
                        <span className="text-[11px] text-slate-400" suppressHydrationWarning>
                          {horaFormateada}
                        </span>
                      </div>

                      <div className="bg-slate-100/80 border border-slate-200/50 rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {item.respuesta}
                      </div>

                      {item.metadata?.empleado && (
                        <TarjetaEmpleadoTardanza
                          empleado={item.metadata.empleado}
                          onJustificado={() => {
                            fetchEstadoAsistente().then((data) => {
                              setResumen(data.resumen);
                            });
                          }}
                        />
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}

          {/* Indicador de carga cuando se consulta a OpenAI */}
          {enviando && (
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#1D63ED]/80 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364 6.364-2.121-2.121M7.757 7.757 5.636 5.636m12.728 0-2.121 2.121M7.757 16.243l-2.121 2.121" />
                </svg>
              </div>
              <div className="space-y-1.5 max-w-2xl flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">AsistenciaAI</span>
                  <span className="text-[11px] text-blue-600 font-semibold">
                    Procesando consulta...
                  </span>
                </div>
                <div className="bg-slate-100/60 border border-slate-200/40 rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-slate-500 italic">
                  Consultando registros biométricos en Supabase...
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Barra inferior de entrada de texto (sin icono de adjuntar archivo) */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              manejarEnvioConsulta();
            }}
            className="flex items-center gap-2 bg-slate-50/90 border border-slate-200/80 rounded-xl px-4 py-2 focus-within:border-blue-500/50 focus-within:bg-white transition"
          >
            <input
              ref={inputRef}
              type="text"
              name="mensaje"
              autoComplete="off"
              value={inputMensaje}
              onChange={(e) => setInputMensaje(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  manejarEnvioConsulta();
                }
              }}
              placeholder="Escribe tu consulta o pide un reporte aquí..."
              className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden py-1.5"
            />

            <button
              type="submit"
              disabled={enviando}
              title="Enviar consulta"
              className="w-8 h-8 rounded-lg bg-[#1D63ED] hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>
              Puedes consultar en tiempo real sobre asistencias, tardanzas, departamentos o el resumen del día.
            </span>
            <span className="font-medium">IA Asistencia v2.4</span>
          </div>
        </div>
      </div>
    </div>
  );
}
