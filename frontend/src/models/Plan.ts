export interface Plan {
  id: string;
  nombre: string;
  precio_mensual: number;
  limite_empleados?: number | null;
  limite_camaras?: number | null;
  limite_sedes?: number | null;
  caracteristicas?: string[];
  es_recomendado?: boolean;
  activo?: boolean;
}

