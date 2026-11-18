import { Camara, DeteccionBiometrica } from '@/models/Camara';
import { requestClientApi } from '@/lib/supabase';

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

const DEFAULT_ESTADO_SISTEMA = {
  estado: 'OPERATIVO',
  precisionGlobal: 98.5,
  tiempoRespuestaMs: 140,
  algoritmo: 'Biometría Facial',
};

export async function fetchCamarasData(): Promise<CamarasResponse> {
  try {
    return await requestClientApi<CamarasResponse>('/api/camaras');
  } catch (err: any) {
    return {
      ok: false,
      camaras: [],
      detecciones: [],
      estadoSistema: DEFAULT_ESTADO_SISTEMA,
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
    return await requestClientApi('/api/camaras', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
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
    return await requestClientApi('/api/camaras', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error de conexión' };
  }
}

export async function eliminarCamara(id: string): Promise<{ ok: boolean; mensaje?: string; error?: string }> {
  try {
    return await requestClientApi(`/api/camaras?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
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
    return await requestClientApi('/api/camaras/reconocimiento', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error al procesar reconocimiento facial.' };
  }
}
