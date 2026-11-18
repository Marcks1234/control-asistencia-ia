export type TipoFuenteCamara = 'WEBCAM_LOCAL' | 'IP_HTTP' | 'IP_RTSP';
export type ModoAccesoCamara = 'ENTRADA' | 'SALIDA' | 'AUTO';

export interface Camara {
  id: string;
  id_empresa?: string;
  nombre: string;
  punto_acceso: string;
  sede: string;
  stream_url?: string | null;
  resolucion?: string;
  estado: 'OPERATIVA' | 'PAUSADA' | 'DESCONECTADA';
  activo?: boolean;
  created_at?: string;
  tipo_fuente?: TipoFuenteCamara;
  device_id?: string;
  modo_acceso?: ModoAccesoCamara;
  es_detectada_local?: boolean;
}

export interface DeteccionBiometrica {
  id: string;
  empleadoId: string;
  nombre: string;
  apellido?: string;
  cargo?: string;
  departamento: string;
  foto_url?: string | null;
  camaraNombre: string;
  puntoAcceso: string;
  confianza: number;
  tipo: 'Entrada' | 'Salida' | 'Tardanza';
  hora: string;
  tiempoRelativo: string;
  estado: string;
}

export function parseCamaraStreamMeta(streamUrl?: string | null): {
  tipo_fuente: TipoFuenteCamara;
  urlLimpia: string;
  device_id?: string;
  modo_acceso: ModoAccesoCamara;
} {
  if (!streamUrl) {
    return { tipo_fuente: 'WEBCAM_LOCAL', urlLimpia: '', modo_acceso: 'AUTO' };
  }

  let raw = streamUrl.trim();
  let modo_acceso: ModoAccesoCamara = 'AUTO';

  const hashIdx = raw.indexOf('#modo=');
  if (hashIdx !== -1) {
    const modePart = raw.slice(hashIdx + 6).toUpperCase();
    if (modePart === 'ENTRADA' || modePart === 'SALIDA' || modePart === 'AUTO') {
      modo_acceso = modePart;
    }
    raw = raw.slice(0, hashIdx);
  }

  if (raw.startsWith('local://')) {
    const devId = raw.replace('local://', '');
    return {
      tipo_fuente: 'WEBCAM_LOCAL',
      urlLimpia: '',
      device_id: devId === 'default' ? undefined : devId,
      modo_acceso,
    };
  }

  if (raw.toLowerCase().startsWith('rtsp://')) {
    return { tipo_fuente: 'IP_RTSP', urlLimpia: raw, modo_acceso };
  }

  return { tipo_fuente: 'IP_HTTP', urlLimpia: raw, modo_acceso };
}

export function buildCamaraStreamUrl(
  tipo: TipoFuenteCamara,
  urlOrDeviceId: string,
  modo: ModoAccesoCamara
): string {
  const base =
    tipo === 'WEBCAM_LOCAL'
      ? `local://${urlOrDeviceId?.trim() || 'default'}`
      : urlOrDeviceId.trim();
  return `${base}#modo=${modo}`;
}
