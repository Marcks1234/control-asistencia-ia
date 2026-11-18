import { AttendanceRecord, Employee } from '@/types/attendance';
import { requestClientApi } from '@/lib/supabase';

export async function fetchAsistencias(): Promise<{
  employees: Employee[];
  records: AttendanceRecord[];
}> {
  try {
    const data = await requestClientApi('/api/asistencias');
    return {
      employees: data.employees || [],
      records: data.records || [],
    };
  } catch {
    return { employees: [], records: [] };
  }
}

async function marcarAsistencia(
  action: 'check-in' | 'check-out',
  employeeId: string,
  time?: string
): Promise<{ ok: boolean; mensaje?: string; error?: string }> {
  try {
    return await requestClientApi('/api/asistencias', {
      method: 'POST',
      body: JSON.stringify({ action, employeeId, time }),
    });
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error de conexión' };
  }
}

export const registrarEntradaEmpleado = (employeeId: string, time?: string) =>
  marcarAsistencia('check-in', employeeId, time);

export const registrarSalidaEmpleado = (employeeId: string, time?: string) =>
  marcarAsistencia('check-out', employeeId, time);
