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
        algoritmo: 'CNN Biométrico (Anti-spoofing activo)',
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
}): Promise<{ ok: boolean; camara?: Camara; mensaje?: string; error?: string }> {
  try {
    const { headers } = getClientAuth();
    const res = await fetch('/api/camaras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error de conexión' };
  }
}

export async function cambiarEstadoCamara(
  id: string,
  estado: 'OPERATIVA' | 'PAUSADA' | 'DESCONECTADA'
): Promise<{ ok: boolean; mensaje?: string; error?: string }> {
  try {
    const { headers } = getClientAuth();
    const res = await fetch('/api/camaras', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ id, estado }),
    });
    return await res.json();
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error de conexión' };
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
    const { headers } = getClientAuth();
    const res = await fetch('/api/camaras/reconocimiento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error al procesar reconocimiento facial.' };
  }
}
