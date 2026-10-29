export interface Usuario {
  id: string;
  id_empresa: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: 'GERENTE' | 'RRHH' | 'ADMIN' | string;
  activo?: boolean;
  avatar_url?: string;
  created_at?: string;
}

