export interface EmpleadoTardanza {
  id: string;
  iniciales: string;
  nombre: string;
  dni?: string;
  cargo?: string;
  codigo_biometrico: string;
  departamento: string;
  turno: string;
  minutos_tardanza: number;
  hora_entrada: string;
  punto_acceso: string;
  confianza_ia?: number;
  motivo?: string;
  estado: 'TARDANZA' | 'PRESENTE' | 'FALTA' | 'JUSTIFICADO';
}

export interface MetadataMensaje {
  tipo?: 'TARJETA_TARDANZA' | 'REPORTE_OPERACIONES';
  empleado?: EmpleadoTardanza;
  empleados?: EmpleadoTardanza[];
}

export interface InteraccionChat {
  id: string;
  mensaje: string;
  respuesta: string;
  metadata?: MetadataMensaje;
  fecha: string;
}

export interface ResumenAsistenciaDia {
  presentes: number;
  tardanzas: number;
  ausentes: number;
  total_plantilla?: number;
  puntualidad_semanal?: string;
}

export interface EstadoInicialAsistente {
  ok: boolean;
  resumen: ResumenAsistenciaDia;
  historial: InteraccionChat[];
}
