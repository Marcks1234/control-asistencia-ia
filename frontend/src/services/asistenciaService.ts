import { AttendanceRecord, Employee } from "@/types/attendance";
import { INITIAL_ATTENDANCE_RECORDS, INITIAL_EMPLOYEES } from "./mockAttendanceData";

export interface AsistenciasApiResponse {
  ok: boolean;
  employees: Employee[];
  records: AttendanceRecord[];
  error?: string;
}

export async function fetchAsistencias(): Promise<{
  employees: Employee[];
  records: AttendanceRecord[];
}> {
  try {
    const res = await fetch("/api/asistencias", {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data: AsistenciasApiResponse = await res.json();
    if (data.ok && Array.isArray(data.employees) && Array.isArray(data.records)) {
      return {
        employees: data.employees.length > 0 ? data.employees : INITIAL_EMPLOYEES,
        records: data.records.length > 0 ? data.records : INITIAL_ATTENDANCE_RECORDS,
      };
    }
  } catch (err) {
    console.warn("[asistenciaService] Usando datos locales de respaldo:", err);
  }

  return {
    employees: INITIAL_EMPLOYEES,
    records: INITIAL_ATTENDANCE_RECORDS,
  };
}

export async function registrarEntradaEmpleado(
  employeeId: string,
  time?: string
): Promise<{ ok: boolean; mensaje?: string; error?: string }> {
  try {
    const res = await fetch("/api/asistencias", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "check-in",
        employeeId,
        time,
      }),
    });

    return await res.json();
  } catch (err: any) {
    console.error("[asistenciaService] Error al registrar entrada:", err);
    return { ok: false, error: err.message };
  }
}

export async function registrarSalidaEmpleado(
  employeeId: string,
  time?: string
): Promise<{ ok: boolean; mensaje?: string; error?: string }> {
  try {
    const res = await fetch("/api/asistencias", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "check-out",
        employeeId,
        time,
      }),
    });

    return await res.json();
  } catch (err: any) {
    console.error("[asistenciaService] Error al registrar salida:", err);
    return { ok: false, error: err.message };
  }
}

