export interface Empleado {
  id: string;
  id_empresa?: string;
  id_departamento?: string;
  id_horario?: string;
  nombre: string;
  apellido: string;
  dni?: string;
  cargo: string;
  codigo_biometrico?: string;
  departamento?: string;
  activo?: boolean;
}

