export type EstadoAsistencia = 'PRESENTE' | 'TARDANZA' | 'FALTA' | 'JUSTIFICADO' | 'PERMISO';

export interface Asistencia {
  id: string;
  id_empresa: string;
  id_empleado: string;
  fecha: string;
  hora_entrada?: string | null;
  hora_salida?: string | null;
  minutos_tardanza?: number;
  horas_trabajadas?: number | string | null;
  estado: EstadoAsistencia;
  metodo?: string;
  punto_acceso?: string;
  confianza_ia?: number | null;
  observacion?: string | null;
}

