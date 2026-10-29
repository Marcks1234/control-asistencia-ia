"use client";

import { useEffect, useRef, useState } from "react";
import { InteraccionChat, ResumenAsistenciaDia } from "@/types/asistente";
import {
  enviarConsultaAsistente,
  fetchEstadoAsistente,
  limpiarHistorialAsistente,
} from "@/services/asistenteService";
import { useAuthUser } from "@/hooks/useAuthUser";
import ChatMessageBubble from "./ChatMessageBubble";

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

const AiAvatarBadge = () => (
  <div className="w-9 h-9 rounded-xl bg-[#1D63ED] text-white flex items-center justify-center shrink-0 shadow-xs">
    <img src="/imgs/icons/sparkle.svg" alt="" className="w-4 h-4" />
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

  const usuario = useAuthUser();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHoraSaludo(formatearHoraMensaje());
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
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
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
    <div className="flex-1 flex flex-col w-full min-h-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Asistente de Consultas</h1>
          <p className="text-xs text-slate-500 mt-0.5">Consultas de asistencia, puntualidad y colaboradores en tiempo real.</p>
        </div>
        <button
          type="button"
          onClick={manejarLimpiarChat}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
        >
          <span>Limpiar chat</span>
        </button>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between overflow-hidden min-h-0">
        <div ref={messagesContainerRef} className="flex-1 p-5 space-y-5 overflow-y-auto min-h-0">
          <div className="flex items-start gap-3.5">
            <AiAvatarBadge />
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Asistente</span>
                <span className="text-[11px] text-slate-400" suppressHydrationWarning>{horaSaludo}</span>
              </div>
              <div className="bg-slate-100/80 border border-slate-200/50 rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-slate-700 leading-relaxed">
                {cargandoResumen ? (
                  <span>Cargando resumen de hoy...</span>
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

          {historial.map((item) => (
            <ChatMessageBubble
              key={item.id}
              item={item}
              hora={formatearHoraMensaje(item.fecha)}
              usuario={usuario}
              onJustificado={() => {
                fetchEstadoAsistente().then((data) => {
                  setResumen(data.resumen);
                  if (data.historial?.length) setHistorial(data.historial);
                });
              }}
              sparkleIcon={<AiAvatarBadge />}
            />
          ))}

          {enviando && (
            <div className="flex items-start gap-3.5">
              <AiAvatarBadge />
              <div className="space-y-1.5 max-w-2xl flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Asistente</span>
                  <span className="text-[11px] text-blue-600 font-semibold">Procesando consulta...</span>
                </div>
                <div className="bg-slate-100/60 border border-slate-200/40 rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-slate-500 italic">
                  Buscando información de asistencia...
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-3.5 border-t border-slate-100 bg-white shrink-0">
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
            <span>Consultas en tiempo real sobre asistencias, tardanzas, departamentos o turnos.</span>
            <span className="font-medium">Control de Asistencia</span>
          </div>
        </div>
      </div>
    </div>
  );
}
