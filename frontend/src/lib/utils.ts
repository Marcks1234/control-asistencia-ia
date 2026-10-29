export function obtenerFechaHoyPeru(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function obtenerHoraActualPeru(): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());
}

export function horaAMinutos(hora: string): number {
  if (!hora) return 0;
  const [h, m] = hora.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutosAHora(minutos: number): string {
  const h = Math.floor(Math.max(0, minutos) / 60);
  const m = Math.floor(Math.max(0, minutos) % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface HorarioTurno {
  hora_entrada?: string | null;
  hora_salida?: string | null;
  tolerancia_minutos?: number | null;
}

export function evaluarReglaEntrada(
  horario: HorarioTurno | undefined,
  horaActual: string,
  nombreCompleto: string
) {
  const horaEntradaProg = horario?.hora_entrada || '08:00:00';
  const horaSalidaProg = horario?.hora_salida || '17:00:00';
  const tolerancia = horario?.tolerancia_minutos ?? 10;

  const minProg = horaAMinutos(horaEntradaProg);
  const minFinProg = horaAMinutos(horaSalidaProg);
  const minAct = horaAMinutos(horaActual);
  const minHabilitado = minProg - 30; // 30 minutos antes

  if (minAct < minHabilitado) {
    return {
      permitida: false,
      estado: 'PRESENTE' as const,
      minutosTardanza: 0,
      observacion: '',
      error: `Aún no es la hora de entrada. El turno de ${nombreCompleto} inicia a las ${horaEntradaProg.slice(0, 5)} (ingreso habilitado desde las ${minutosAHora(minHabilitado)}).`,
    };
  }

  if (minAct >= minFinProg) {
    return {
      permitida: false,
      estado: 'PRESENTE' as const,
      minutosTardanza: 0,
      observacion: '',
      error: `El turno de ${nombreCompleto} (${horaEntradaProg.slice(0, 5)} - ${horaSalidaProg.slice(0, 5)}) ya finalizó hoy. No es posible registrar entrada.`,
    };
  }

  const dif = minAct - minProg;
  if (dif > tolerancia) {
    return {
      permitida: true,
      estado: 'TARDANZA' as const,
      minutosTardanza: dif,
      observacion: `Ingreso con tardanza (+${dif} min)`,
    };
  }

  return {
    permitida: true,
    estado: 'PRESENTE' as const,
    minutosTardanza: 0,
    observacion: dif < 0 ? `Ingreso puntual anticipado (${Math.abs(dif)} min antes)` : 'Ingreso puntual',
  };
}

export function calcularHorasTrabajadas(horaEntrada: string, horaSalida: string) {
  const diffMin = Math.max(1, horaAMinutos(horaSalida) - horaAMinutos(horaEntrada));
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return {
    horasDecimal: (diffMin / 60).toFixed(2),
    textoFormateado: `${h}h ${String(m).padStart(2, '0')}m`,
  };
}
