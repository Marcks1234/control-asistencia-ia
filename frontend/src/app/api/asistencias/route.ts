import { NextRequest, NextResponse } from 'next/server';
import { querySupabase, resolverIdEmpresa } from '@/lib/supabase';
import { obtenerFechaHoyPeru, obtenerHoraActualPeru, evaluarReglaEntrada, calcularHorasTrabajadas } from '@/lib/utils';
import { Employee, AttendanceRecord, AttendanceStatus } from '@/types/attendance';

async function guardarRegistroAsistencia(
  existenteId: string | undefined,
  payload: Record<string, any>,
  insertContext?: { id_empresa: string; id_empleado: string; fecha: string }
) {
  const endpoint = existenteId ? `asistencias?id=eq.${existenteId}` : 'asistencias';
  const method = existenteId ? 'PATCH' : 'POST';
  const body = existenteId ? payload : { ...insertContext, ...payload };
  const res = await querySupabase<any[]>(endpoint, {
    method,
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  return Array.isArray(res) ? res[0] : res;
}

async function asegurarJornadaDeHoy(fechaHoy: string, idEmpresa: string, empleados: any[]) {
  const asistenciasHoy = await querySupabase<any[]>(
    `asistencias?id_empresa=eq.${idEmpresa}&fecha=eq.${fechaHoy}&select=id,id_empleado,fecha,hora_entrada,hora_salida,minutos_tardanza,horas_trabajadas,estado,metodo,punto_acceso,confianza_ia,observacion&order=created_at.desc`
  );
  if (Array.isArray(asistenciasHoy) && asistenciasHoy.length > 0) return asistenciasHoy;
  if (!Array.isArray(empleados) || empleados.length === 0) return [];

  const filas = empleados.map((emp) => ({
    id_empresa: emp.id_empresa || idEmpresa,
    id_empleado: emp.id,
    fecha: fechaHoy,
    hora_entrada: null,
    hora_salida: null,
    minutos_tardanza: 0,
    horas_trabajadas: null,
    estado: 'FALTA',
    metodo: 'SISTEMA',
    punto_acceso: 'Sin registro',
    confianza_ia: null,
    observacion: 'Pendiente de marcación',
  }));

  const insertadas = await querySupabase<any[]>('asistencias', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(filas),
  });
  return Array.isArray(insertadas) ? insertadas : [];
}

export async function GET(req: NextRequest) {
  try {
    const idEmpresa = resolverIdEmpresa(req);
    const fechaHoy = obtenerFechaHoyPeru();

    const empleadosData = await querySupabase<any[]>(
      `empleados?id_empresa=eq.${idEmpresa}&select=id,nombre,apellido,dni,cargo,codigo_biometrico,id_empresa,departamentos(nombre),horarios(descripcion,hora_entrada,hora_salida)&activo=eq.true&order=created_at.asc`
    );

    const listaEmpleados = Array.isArray(empleadosData) ? empleadosData : [];
    const listaAsistencias = await asegurarJornadaDeHoy(fechaHoy, idEmpresa, listaEmpleados);

    const mapaAsistencia = new Map<string, any>();
    for (const a of listaAsistencias) {
      if (!mapaAsistencia.has(a.id_empleado)) mapaAsistencia.set(a.id_empleado, a);
    }

    const employees: Employee[] = [];
    const records: AttendanceRecord[] = [];

    for (const emp of listaEmpleados) {
      const asist = mapaAsistencia.get(emp.id);
      const est = asist?.estado ? String(asist.estado).toUpperCase() : 'FALTA';
      const statusUi: AttendanceStatus =
        est === 'PRESENTE' || est === 'JUSTIFICADO' ? 'presente' :
        est === 'TARDANZA' ? 'tardanza' :
        est === 'PERMISO' ? 'permiso' : 'ausente';

      const name = `${emp.nombre} ${emp.apellido}`.trim();
      const department = emp.departamentos?.nombre || 'Operaciones';
      const shift = emp.horarios?.descripcion || 'Turno Mañana';
      const horaIni = emp.horarios?.hora_entrada?.slice(0, 5) || '08:00';
      const horaFin = emp.horarios?.hora_salida?.slice(0, 5) || '17:00';
      const checkIn = asist?.hora_entrada?.slice(0, 5) || null;
      const checkOut = asist?.hora_salida?.slice(0, 5) || (checkIn ? 'En curso' : null);

      employees.push({
        id: emp.id,
        name,
        department,
        role: emp.cargo || 'Colaborador',
        shift,
        shiftSchedule: `${horaIni} - ${horaFin}`,
        startTime: horaIni,
        status: statusUi,
        checkIn,
        checkOut,
      });

      let hours: string | null = null;
      if (asist?.hora_salida && Number(asist?.horas_trabajadas) > 0) {
        const numH = Number(asist.horas_trabajadas);
        hours = `${Math.floor(numH)}h ${String(Math.round((numH % 1) * 60)).padStart(2, '0')}m`;
      } else if (checkIn && !asist?.hora_salida) {
        hours = 'En curso';
      }

      records.push({
        id: asist?.id || `rec-${emp.id}`,
        employeeId: emp.id,
        name,
        department,
        shift,
        shiftTime: horaIni,
        status: statusUi,
        checkIn,
        checkOut,
        hours,
        note: asist?.minutos_tardanza > 0 ? `+${asist.minutos_tardanza} min tarde` : asist?.observacion || null,
        noteType: est === 'TARDANZA' ? 'warning' : est === 'FALTA' ? 'danger' : 'info',
      });
    }

    return NextResponse.json({ ok: true, fecha: fechaHoy, employees, records });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, employeeId, time, metodo, punto_acceso, confianza_ia, id_camara } = await req.json();
    if (!employeeId) return NextResponse.json({ ok: false, error: 'employeeId requerido' }, { status: 400 });

    const idEmpresa = resolverIdEmpresa(req);
    const fechaHoy = obtenerFechaHoyPeru();
    const horaActual = time || obtenerHoraActualPeru();

    const empData = await querySupabase<any[]>(
      `empleados?id=eq.${employeeId}&select=id,id_empresa,nombre,apellido,horarios(hora_entrada,hora_salida,tolerancia_minutos)&limit=1`
    );
    const empleado = Array.isArray(empData) && empData[0] ? empData[0] : null;
    if (!empleado) return NextResponse.json({ ok: false, error: 'Empleado no encontrado' }, { status: 404 });

    const nombreCompleto = `${empleado.nombre} ${empleado.apellido}`.trim();
    const asistHoy = await querySupabase<any[]>(`asistencias?id_empleado=eq.${employeeId}&fecha=eq.${fechaHoy}&limit=1`);
    const asistenciaExistente = Array.isArray(asistHoy) && asistHoy[0] ? asistHoy[0] : null;

    if (action === 'check-in') {
      if (asistenciaExistente?.hora_entrada) {
        return NextResponse.json(
          { ok: false, error: `${nombreCompleto} ya registró su entrada hoy a las ${asistenciaExistente.hora_entrada.slice(0, 5)}.` },
          { status: 400 }
        );
      }

      const horario = Array.isArray(empleado.horarios) ? empleado.horarios[0] : empleado.horarios;
      const evaluacion = evaluarReglaEntrada(horario, horaActual, nombreCompleto);
      if (!evaluacion.permitida) {
        return NextResponse.json({ ok: false, error: evaluacion.error || 'Ingreso fuera de horario.' }, { status: 400 });
      }

      const data = await guardarRegistroAsistencia(
        asistenciaExistente?.id,
        {
          hora_entrada: horaActual,
          hora_salida: null,
          horas_trabajadas: null,
          estado: evaluacion.estado,
          minutos_tardanza: evaluacion.minutosTardanza,
          metodo: metodo || 'MANUAL',
          punto_acceso: punto_acceso || 'Control Manual / Web',
          confianza_ia:
            confianza_ia !== undefined && confianza_ia !== null
              ? Number(confianza_ia)
              : metodo === 'BIOMETRIA_FACIAL' || metodo === 'BIOMETRICO_IA'
                ? 98.7
                : null,
          id_camara: id_camara || null,
          observacion: evaluacion.observacion,
        },
        { id_empresa: empleado.id_empresa || idEmpresa, id_empleado: employeeId, fecha: fechaHoy }
      );

      return NextResponse.json({
        ok: true,
        mensaje: `Entrada de ${nombreCompleto} registrada hoy a las ${horaActual.slice(0, 5)}.`,
        data,
      });
    }

    if (action === 'check-out') {
      if (!asistenciaExistente?.hora_entrada) {
        return NextResponse.json(
          { ok: false, error: `No se puede registrar salida: ${nombreCompleto} aún no ha registrado entrada hoy.` },
          { status: 400 }
        );
      }
      if (asistenciaExistente.hora_salida) {
        return NextResponse.json(
          { ok: false, error: `${nombreCompleto} ya registró su salida hoy a las ${asistenciaExistente.hora_salida.slice(0, 5)}.` },
          { status: 400 }
        );
      }

      const { horasDecimal } = calcularHorasTrabajadas(asistenciaExistente.hora_entrada, horaActual);
      const data = await guardarRegistroAsistencia(asistenciaExistente.id, {
        hora_salida: horaActual,
        horas_trabajadas: horasDecimal,
        ...(metodo ? { metodo } : {}),
        ...(punto_acceso ? { punto_acceso } : {}),
        ...(confianza_ia !== undefined && confianza_ia !== null ? { confianza_ia: Number(confianza_ia) } : {}),
        ...(id_camara ? { id_camara } : {}),
      });

      return NextResponse.json({
        ok: true,
        mensaje: `Salida de ${nombreCompleto} registrada hoy a las ${horaActual.slice(0, 5)}.`,
        data,
      });
    }

    return NextResponse.json({ ok: false, error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
