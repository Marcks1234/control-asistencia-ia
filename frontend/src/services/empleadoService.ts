import { requestClientApi } from '@/lib/supabase';

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
  foto_url?: string | null;
  descripcion_facial?: number[] | null;
  id_departamento?: string;
  id_horario?: string;
  departamentos?: { nombre: string } | null;
  horarios?: { id?: string; descripcion: string; hora_entrada: string; hora_salida: string } | null;
}

export interface DepartamentoOption {
  id: string;
  nombre: string;
}

export async function fetchEmpleadosPrueba() {
  try {
    const data = await requestClientApi('/api/empleados');
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
  requestClientApi('/api/empleados', { method: 'POST', body: JSON.stringify(payload) });

export const asignarTurnoEmpleado = (idEmpleado: string, id_horario?: string | null, id_departamento?: string | null) => {
  const body: Record<string, any> = { idEmpleado };
  if (id_horario !== undefined) body.id_horario = id_horario;
  if (id_departamento !== undefined) body.id_departamento = id_departamento;
  return requestClientApi('/api/empleados', { method: 'PATCH', body: JSON.stringify(body) });
};

export const actualizarBiometriaEmpleado = (
  idEmpleado: string,
  foto_url: string | null,
  descripcion_facial: number[] | null
) =>
  requestClientApi('/api/empleados', {
    method: 'PATCH',
    body: JSON.stringify({ idEmpleado, foto_url, descripcion_facial }),
  });

export const eliminarEmpleadoPrueba = (id: string) =>
  requestClientApi(`/api/empleados?id=${encodeURIComponent(id)}`, { method: 'DELETE' });

export const crearTurnoPrueba = (payload: any) =>
  requestClientApi('/api/turnos', { method: 'POST', body: JSON.stringify(payload) });

export const eliminarTurnoPrueba = (id: string) =>
  requestClientApi(`/api/turnos?id=${encodeURIComponent(id)}`, { method: 'DELETE' });

export const crearDepartamentoPrueba = (nombre: string) =>
  requestClientApi('/api/departamentos', { method: 'POST', body: JSON.stringify({ nombre }) });

export const eliminarDepartamentoPrueba = (id: string) =>
  requestClientApi(`/api/departamentos?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
