import { getClientAuth } from '@/lib/supabase';

export interface TurnoOption {
  id: string;
  descripcion: string;
  hora_entrada: string;
  hora_salida: string;
  dias?: string;
  tolerancia_minutos?: number;
}

export interface EmpleadoItem {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  cargo: string;
  codigo_biometrico: string;
  id_departamento?: string;
  id_horario?: string;
  departamentos?: { nombre: string } | null;
  horarios?: { id?: string; descripcion: string; hora_entrada: string; hora_salida: string } | null;
}

export interface DepartamentoOption {
  id: string;
  nombre: string;
}

async function requestApi<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const { headers, idEmpresa } = getClientAuth();
  const sep = endpoint.includes('?') ? '&' : '?';
  const url = idEmpresa ? `${endpoint}${sep}id_empresa=${encodeURIComponent(idEmpresa)}` : endpoint;
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...headers, ...(options?.headers || {}) },
  });
  return res.json();
}

export async function fetchEmpleadosPrueba() {
  try {
    const data = await requestApi('/api/empleados');
    return {
      ok: Boolean(data.ok),
      empleados: (data.empleados || []) as EmpleadoItem[],
      departamentos: (data.departamentos || []) as DepartamentoOption[],
      turnos: (data.horarios || []) as TurnoOption[],
    };
  } catch {
    return { ok: false, empleados: [], departamentos: [], turnos: [] };
  }
}

export const crearEmpleadoPrueba = (payload: any) =>
  requestApi('/api/empleados', { method: 'POST', body: JSON.stringify(payload) });

export const asignarTurnoEmpleado = (idEmpleado: string, id_horario?: string | null, id_departamento?: string | null) => {
  const body: Record<string, any> = { idEmpleado };
  if (id_horario !== undefined) body.id_horario = id_horario;
  if (id_departamento !== undefined) body.id_departamento = id_departamento;
  return requestApi('/api/empleados', { method: 'PATCH', body: JSON.stringify(body) });
};

export const eliminarEmpleadoPrueba = (id: string) =>
  requestApi(`/api/empleados?id=${encodeURIComponent(id)}`, { method: 'DELETE' });

export const crearTurnoPrueba = (payload: any) =>
  requestApi('/api/turnos', { method: 'POST', body: JSON.stringify(payload) });

export const eliminarTurnoPrueba = (id: string) =>
  requestApi(`/api/turnos?id=${encodeURIComponent(id)}`, { method: 'DELETE' });

export const crearDepartamentoPrueba = (nombre: string) =>
  requestApi('/api/departamentos', { method: 'POST', body: JSON.stringify({ nombre }) });

export const eliminarDepartamentoPrueba = (id: string) =>
  requestApi(`/api/departamentos?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
