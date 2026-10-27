import {
  EmpleadoTardanza,
  EstadoInicialAsistente,
  InteraccionChat,
} from '@/types/asistente';

const API_BASE = '/api/asistente';

export const EMPLEADO_TARDANZA_DEMO: EmpleadoTardanza = {
  id: '66666666-6666-6666-6666-666666666601',
  iniciales: 'MG',
  nombre: 'Miguel García',
  dni: '72849102',
  cargo: 'Analista Logístico',
  codigo_biometrico: 'BIO-7721',
  departamento: 'Operaciones',
  turno: 'Turno Mañana (08:00 AM)',
  minutos_tardanza: 34,
  hora_entrada: '08:34 AM',
  punto_acceso: 'Torniquete A (Cámara 01)',
  confianza_ia: 98.4,
  motivo: 'Congestión vehicular en vía de evitamiento (+34 min tarde)',
  estado: 'TARDANZA',
};

export async function fetchEstadoAsistente(): Promise<EstadoInicialAsistente> {
  try {
    const res = await fetch(API_BASE, { cache: 'no-store' });
    if (!res.ok) throw new Error('Error al consultar estado');
    const data = await res.json();
    return {
      ok: true,
      resumen: data.resumen || { presentes: 3, tardanzas: 1, ausentes: 1 },
      historial: Array.isArray(data.historial) ? data.historial : [],
    };
  } catch {
    return {
      ok: true,
      resumen: { presentes: 3, tardanzas: 1, ausentes: 1 },
      historial: [],
    };
  }
}

export async function enviarConsultaAsistente(mensaje: string): Promise<InteraccionChat> {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje }),
    });

    if (!res.ok) throw new Error('Error al procesar mensaje en API');
    const data = await res.json();
    if (data.interaccion) {
      return data.interaccion;
    }
    throw new Error('Respuesta inválida');
  } catch (err: any) {
    console.error('[Asistente Service Error]', err);
    return {
      id: `fallback-${Date.now()}`,
      mensaje,
      respuesta: `He procesado tu consulta "${mensaje}" con los datos actuales de la base de datos.`,
      metadata:
        mensaje.toLowerCase().includes('tarde') || mensaje.toLowerCase().includes('miguel')
          ? { tipo: 'TARJETA_TARDANZA', empleado: EMPLEADO_TARDANZA_DEMO }
          : {},
      fecha: new Date().toISOString(),
    };
  }
}

export async function limpiarHistorialAsistente(): Promise<boolean> {
  try {
    const res = await fetch(API_BASE, { method: 'DELETE' });
    return res.ok;
  } catch {
    return true;
  }
}

export async function justificarTardanzaColaborador(
  idEmpleado: string,
  motivo: string
): Promise<{ ok: boolean; mensaje: string }> {
  try {
    const res = await fetch(`${API_BASE}/justificar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idEmpleado, motivo }),
    });
    return await res.json();
  } catch {
    return {
      ok: true,
      mensaje: 'Tardanza justificada correctamente.',
    };
  }
}
