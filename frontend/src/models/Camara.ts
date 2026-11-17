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
