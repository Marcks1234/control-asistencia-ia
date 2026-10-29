/**
 * Modelos de Dominio Frontend (TypeScript Interfaces)
 * Equivalentes a las entidades del backend
 */

export interface Empresa {
  id: string;
  nombre: string;
  ruc?: string;
  telefono?: string;
  ciudad?: string;
  direccion?: string;
  activo: boolean;
  created_at?: string;
}

export interface Usuario {
  id: string;
  id_empresa: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: 'GERENTE' | 'RRHH' | 'ADMIN';
  activo: boolean;
  avatar_url?: string;
  created_at?: string;
}

export interface Plan {
  id: string;
  nombre: string;
  limite_empleados: number | null;
  limite_camaras: number | null;
  limite_sedes?: number | null;
  precio_mensual: number;
  caracteristicas: string[];
  es_recomendado?: boolean;
  activo?: boolean;
}

