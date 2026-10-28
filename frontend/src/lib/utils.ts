import tls from 'node:tls';

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
    observacion: dif < 0 ? `Ingreso puntual anticipado (${Math.abs(dif)} min antes)` : 'Ingreso puntual (registro manual)',
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

export function enviarSmtpGmail({
  remitente,
  appPassword,
  destinatario,
  asunto,
  html,
}: {
  remitente: string;
  appPassword: string;
  destinatario: string;
  asunto: string;
  html: string;
}): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const pass = appPassword.replace(/\s+/g, '');
    const socket = tls.connect({ host: 'smtp.gmail.com', port: 465, servername: 'smtp.gmail.com' });
    let paso = 0;
    let buffer = '';

    const send = (c: string) => socket.write(`${c}\r\n`);
    socket.setTimeout(10000, () => { socket.destroy(); reject(new Error('Timeout SMTP')); });
    socket.on('error', reject);
    socket.on('data', (d) => {
      buffer += d.toString();
      if (!buffer.endsWith('\r\n')) return;
      const lines = buffer.trim().split('\r\n');
      const code = parseInt(lines[lines.length - 1].slice(0, 3), 10);
      buffer = '';

      if (code >= 400) { socket.end(); return reject(new Error(`Error SMTP ${code}`)); }
      if (paso === 0 && code === 220) { paso = 1; send('EHLO asistencia-ia.local'); }
      else if (paso === 1 && code === 250) { paso = 2; send('AUTH LOGIN'); }
      else if (paso === 2 && code === 334) { paso = 3; send(Buffer.from(remitente).toString('base64')); }
      else if (paso === 3 && code === 334) { paso = 4; send(Buffer.from(pass).toString('base64')); }
      else if (paso === 4 && code === 235) { paso = 5; send(`MAIL FROM:<${remitente}>`); }
      else if (paso === 5 && code === 250) { paso = 6; send(`RCPT TO:<${destinatario}>`); }
      else if (paso === 6 && code === 250) { paso = 7; send('DATA'); }
      else if (paso === 7 && code === 354) {
        paso = 8;
        send(`From: "Asistencia-IA" <${remitente}>\r\nTo: <${destinatario}>\r\nSubject: =?UTF-8?B?${Buffer.from(asunto).toString('base64')}?=\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${html}\r\n.`);
      } else if (paso === 8 && code === 250) {
        paso = 9;
        send('QUIT');
        socket.end();
        resolve(true);
      }
    });
  });
}

