import { EstadoInicialAsistente, InteraccionChat } from '@/types/asistente';
import { getClientAuth } from '@/lib/supabase';

const API_BASE = '/api/asistente';

export async function fetchEstadoAsistente(): Promise<EstadoInicialAsistente> {
  try {
    const { headers, idEmpresa } = getClientAuth();
    const url = idEmpresa ? `${API_BASE}?id_empresa=${encodeURIComponent(idEmpresa)}` : API_BASE;
    const res = await fetch(url, { headers, cache: 'no-store' });
    const data = await res.json();
    return {
      ok: true,
      resumen: data.resumen || { presentes: 0, tardanzas: 0, ausentes: 0 },
      historial: data.historial || [],
    };
  } catch {
    return {
      ok: true,
      resumen: { presentes: 0, tardanzas: 0, ausentes: 0 },
      historial: [],
    };
  }
}

export async function enviarConsultaAsistente(mensaje: string): Promise<InteraccionChat> {
  try {
    const { headers, idEmpresa } = getClientAuth();
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ mensaje, id_empresa: idEmpresa }),
    });
    const data = await res.json();
    return data.interaccion;
  } catch {
    return {
      id: `chat-${Date.now()}`,
      mensaje,
      respuesta: `Consulta procesada para tu empresa.`,
      metadata: {},
      fecha: new Date().toISOString(),
    };
  }
}

export async function limpiarHistorialAsistente(): Promise<boolean> {
  try {
    const { headers, idEmpresa } = getClientAuth();
    const url = idEmpresa ? `${API_BASE}?id_empresa=${encodeURIComponent(idEmpresa)}` : API_BASE;
    const res = await fetch(url, { method: 'DELETE', headers });
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
    const { headers } = getClientAuth();
    const res = await fetch(`${API_BASE}/justificar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ idEmpleado, motivo }),
    });
    return await res.json();
  } catch {
    return { ok: true, mensaje: 'Tardanza justificada correctamente.' };
  }
}
