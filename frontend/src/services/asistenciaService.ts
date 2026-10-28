import { AttendanceRecord, Employee } from '@/types/attendance';
import { getClientAuth } from '@/lib/supabase';

export async function fetchAsistencias(): Promise<{
  employees: Employee[];
  records: AttendanceRecord[];
}> {
  try {
    const { headers, idEmpresa } = getClientAuth();
    const url = idEmpresa ? `/api/asistencias?id_empresa=${encodeURIComponent(idEmpresa)}` : '/api/asistencias';
    const res = await fetch(url, { headers, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      employees: data.employees || [],
      records: data.records || [],
    };
  } catch {
    return { employees: [], records: [] };
  }
}

export async function registrarEntradaEmpleado(
  employeeId: string,
  time?: string
): Promise<{ ok: boolean; mensaje?: string; error?: string }> {
  try {
    const { headers } = getClientAuth();
    const res = await fetch('/api/asistencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ action: 'check-in', employeeId, time }),
    });
    return await res.json();
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error de conexión' };
  }
}

export async function registrarSalidaEmpleado(
  employeeId: string,
  time?: string
): Promise<{ ok: boolean; mensaje?: string; error?: string }> {
  try {
    const { headers } = getClientAuth();
    const res = await fetch('/api/asistencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ action: 'check-out', employeeId, time }),
    });
    return await res.json();
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error de conexión' };
  }
}
