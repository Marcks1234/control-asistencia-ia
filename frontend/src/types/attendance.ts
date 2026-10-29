export type AttendanceStatus = 'presente' | 'ausente' | 'tardanza' | 'permiso' | 'esperado';

export interface Employee {
  id: string;
  name: string;
  department: string;
  role?: string;
  shift: string;
  shiftSchedule: string;
  startTime: string;
  status: AttendanceStatus;
  checkIn?: string | null;
  checkOut?: string | null;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  shift: string;
  shiftTime: string;
  status: AttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
  hours: string | null;
  note: string | null;
  noteType?: 'warning' | 'danger' | 'info' | 'normal';
}

export type FilterStatus = 'todos' | 'presente' | 'ausente' | 'tardanza' | 'permiso' | 'esperado';
