import { Camara, DeteccionBiometrica } from '@/models/Camara';
import { getClientAuth } from '@/lib/supabase';

export interface CamarasResponse {
  ok: boolean;
  camaras: Camara[];
  detecciones: DeteccionBiometrica[];
  estadoSistema: {
    estado: string;
    precisionGlobal: number;
    tiempoRespuestaMs: number;
    algoritmo: string;
  };
  error?: string;
}

export async function fetchCamarasData(): Promise<CamarasResponse> {
  try {
    const { headers, idEmpresa } = getClientAuth();
    const url = idEmpresa ? `/api/camaras?id_empresa=${encodeURIComponent(idEmpresa)}` : '/api/camaras';
    const res = await fetch(url, { headers, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      ok: false,
      camaras: [],
      detecciones: [],
      estadoSistema: {
        estado: 'OPERATIVO',
        precisionGlobal: 98.5,
        tiempoRespuestaMs: 140,
        algoritmo: 'face-api.js CNN (68 Landmarks · Descriptor 128D)',
      },
      error: err?.message,
    };
  }
}

export async function conectarNuevaCamara(payload: {
  nombre: string;
  punto_acceso: string;
  sede?: string;
  resolucion?: string;
  stream_url?: string | null;
}): Promise<{ ok: boolean; camara?: Camara; mensaje?: string; error?: string }> {
  try {
    const { headers, idEmpresa } = getClientAuth();
    const url = idEmpresa ? `/api/camaras?id_empresa=${encodeURIComponent(idEmpresa)}` : '/api/camaras';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error de conexión' };
  }
}

export async function actualizarCamara(payload: {
  id: string;
  estado?: 'OPERATIVA' | 'PAUSADA' | 'DESCONECTADA';
  stream_url?: string;
}): Promise<{ ok: boolean; mensaje?: string; error?: string }> {
  try {
    const { headers } = getClientAuth();
    const res = await fetch('/api/camaras', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error de conexión' };
  }
}

export async function eliminarCamara(id: string): Promise<{ ok: boolean; mensaje?: string; error?: string }> {
  try {
    const { headers } = getClientAuth();
    const res = await fetch(`/api/camaras?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers,
    });
    return await res.json();
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error al eliminar cámara' };
  }
}

export async function registrarMarcacionBiometrica(payload: {
  employeeId: string;
  id_camara?: string;
  punto_acceso?: string;
  confianza_ia?: number;
  accion?: 'auto' | 'check-in' | 'check-out';
}): Promise<{
  ok: boolean;
  tipo?: 'Entrada' | 'Salida' | 'Tardanza';
  mensaje?: string;
  yaRegistrado?: boolean;
  asistencia?: any;
  empleado?: any;
  error?: string;
}> {
  try {
    const { headers, idEmpresa } = getClientAuth();
    const url = idEmpresa
      ? `/api/camaras/reconocimiento?id_empresa=${encodeURIComponent(idEmpresa)}`
      : '/api/camaras/reconocimiento';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error al procesar reconocimiento facial.' };
  }
}
