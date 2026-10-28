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
    return isNaN(fecha.getTime())
      ? new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: true })
      : fecha.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return "Ahora";
  }
}

const SparkleIcon = () => (
  <div className="w-9 h-9 rounded-xl bg-[#1D63ED] text-white flex items-center justify-center shrink-0 shadow-xs">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
    </svg>
  </div>
);

const SUGERENCIAS = [
  { texto: "¿Quién llegó tarde hoy?", pregunta: "¿Quién llegó tarde hoy y cuál es el motivo?" },
  { texto: "Ver reporte de Operaciones", pregunta: "Ver reporte de Operaciones" },
  { texto: "Generar resumen del día", pregunta: "Generar resumen del día" },
];

export default function ChatWindow({ externalPrompt, onExternalPromptHandled }: ChatWindowProps) {
  const [resumen, setResumen] = useState<ResumenAsistenciaDia>({ presentes: 0, tardanzas: 0, ausentes: 0 });
  const [cargandoResumen, setCargandoResumen] = useState(true);
  const [historial, setHistorial] = useState<InteraccionChat[]>([]);
  const [inputMensaje, setInputMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [horaSaludo, setHoraSaludo] = useState<string>("08:00 AM");
  const [usuario, setUsuario] = useState({ nombre: "", nombreCompleto: "Usuario", iniciales: "U" });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHoraSaludo(formatearHoraMensaje());
    try {
      const guardado = localStorage.getItem("asistencia_usuario");
      if (guardado) {
        const p = JSON.parse(guardado);
        if (p?.nombre) {
          setUsuario({
            nombre: p.nombre,
            nombreCompleto: `${p.nombre} ${p.apellido || ""}`.trim(),
            iniciales: `${p.nombre[0] || "U"}${p.apellido?.[0] || ""}`.toUpperCase(),
          });
        }
      }
    } catch {}

    let cancelado = false;
    fetchEstadoAsistente().then((data) => {
      if (cancelado) return;
      setResumen(data.resumen);
      if (data.historial?.length) setHistorial(data.historial);
      setCargandoResumen(false);
    });
    return () => { cancelado = true; };
  }, []);

  useEffect(() => {
    if (externalPrompt && !enviando) {
      manejarEnvioConsulta(externalPrompt);
      onExternalPromptHandled?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPrompt]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [historial, enviando]);

  const manejarEnvioConsulta = async (textoConsulta?: string) => {
    const consultaFinal = (textoConsulta ?? (inputMensaje || inputRef.current?.value || "")).trim();
    if (!consultaFinal || enviando) return;

    setInputMensaje("");
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
    setEnviando(true);

    const tempId = `temp-${Date.now()}`;
    setHistorial((prev) => [...prev, { id: tempId, mensaje: consultaFinal, respuesta: "", fecha: new Date().toISOString() }]);

    try {
      const nueva = await enviarConsultaAsistente(consultaFinal);
      setHistorial((prev) => prev.map((item) => (item.id === tempId ? nueva : item)));
    } catch {
      setHistorial((prev) =>
        prev.map((item) =>
          item.id === tempId ? { ...item, respuesta: "No se pudo completar la consulta. Por favor intenta nuevamente." } : item
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

  return (
    <div className="flex-1 flex flex-col w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Asistente Inteligente IA</h1>
          <p className="text-xs text-slate-500 mt-1">Consultas en tiempo real sobre asistencia, puntualidad y métricas del personal.</p>
        </div>
        <button
          type="button"
          onClick={manejarLimpiarChat}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
        >
          <span>Limpiar chat</span>
        </button>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between overflow-hidden min-h-[540px]">
        {/* Mensajes */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[600px]">
          {/* Bienvenida */}
          <div className="flex items-start gap-3.5">
            <SparkleIcon />
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">AsistenciaAI</span>
                <span className="text-[11px] text-slate-400" suppressHydrationWarning>{horaSaludo}</span>
              </div>
              <div className="bg-slate-100/80 border border-slate-200/50 rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-slate-700 leading-relaxed">
                {cargandoResumen ? (
                  <span>Consultando asistencias en la base de datos...</span>
                ) : (
                  <>
                    Hola <span suppressHydrationWarning>{usuario.nombre}</span>, hoy tenemos{" "}
                    <span className="font-bold text-emerald-600">{resumen.presentes} presentes</span>,{" "}
                    <span className="font-bold text-amber-600">{resumen.tardanzas} tardanzas</span> y{" "}
                    <span className="font-bold text-red-600">{resumen.ausentes} ausentes</span> registrados en tu empresa. ¿En qué te puedo ayudar?
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {SUGERENCIAS.map((chip) => (
                  <button
                    key={chip.texto}
                    type="button"
                    onClick={() => manejarEnvioConsulta(chip.pregunta)}
                    disabled={enviando}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-[11px] font-semibold text-slate-700 transition cursor-pointer disabled:opacity-50"
                  >
                    <span>{chip.texto}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Historial */}
          {historial.map((item) => {
            const hora = formatearHoraMensaje(item.fecha);
            return (
              <div key={item.id} className="space-y-5">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] text-slate-400" suppressHydrationWarning>{hora}</span>
                    <span className="text-xs font-bold text-slate-800" suppressHydrationWarning>{usuario.nombreCompleto}</span>
                    <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center" suppressHydrationWarning>
                      {usuario.iniciales}
                    </div>
                  </div>
                  <div className="bg-[#1D63ED] text-white text-xs font-medium px-4 py-3 rounded-2xl rounded-tr-sm max-w-md shadow-xs whitespace-pre-wrap leading-relaxed">
                    {item.mensaje}
                  </div>
                </div>

                {item.respuesta && (
                  <div className="flex items-start gap-3.5">
                    <SparkleIcon />
                    <div className="space-y-2.5 max-w-2xl flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">AsistenciaAI</span>
                        <span className="text-[11px] text-slate-400" suppressHydrationWarning>{hora}</span>
                      </div>
                      <div className="bg-slate-100/80 border border-slate-200/50 rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {item.respuesta}
                      </div>
                      {item.metadata?.empleado && (
                        <TarjetaEmpleadoTardanza
                          empleado={item.metadata.empleado}
                          onJustificado={() => {
                            fetchEstadoAsistente().then((data) => setResumen(data.resumen));
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {enviando && (
            <div className="flex items-start gap-3.5">
              <SparkleIcon />
              <div className="space-y-1.5 max-w-2xl flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">AsistenciaAI</span>
                  <span className="text-[11px] text-blue-600 font-semibold">Procesando consulta...</span>
                </div>
                <div className="bg-slate-100/60 border border-slate-200/40 rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-slate-500 italic">
                  Consultando registros biométricos en Supabase...
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
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
              placeholder="Escribe tu consulta o pide un reporte aquí..."
              className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden py-1.5"
            />
            <button
              type="submit"
              disabled={enviando}
              title="Enviar consulta"
              className="w-8 h-8 rounded-lg bg-[#1D63ED] hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center transition cursor-pointer text-xs font-bold"
            >
              ↑
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>Puedes consultar en tiempo real sobre asistencias, tardanzas, departamentos o el resumen del día.</span>
            <span className="font-medium">IA Asistencia v2.4</span>
          </div>
        </div>
      </div>
    </div>
  );
}
