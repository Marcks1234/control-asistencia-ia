import { NextRequest, NextResponse } from 'next/server';
import { querySupabase, resolverIdEmpresa } from '@/lib/supabase';
import { obtenerFechaHoyPeru, obtenerHoraActualPeru, evaluarReglaEntrada, calcularHorasTrabajadas } from '@/lib/utils';
import { Employee, AttendanceRecord, AttendanceStatus } from '@/types/attendance';

async function asegurarJornadaDeHoy(fechaHoy: string, idEmpresa: string, empleados: any[]) {
  const asistenciasHoy = await querySupabase<any[]>(
    `asistencias?id_empresa=eq.${idEmpresa}&fecha=eq.${fechaHoy}&select=id,id_empleado,fecha,hora_entrada,hora_salida,minutos_tardanza,horas_trabajadas,estado,metodo,punto_acceso,confianza_ia,observacion&order=created_at.desc`
  );

  if (Array.isArray(asistenciasHoy) && asistenciasHoy.length > 0) return asistenciasHoy;
  if (!Array.isArray(empleados) || empleados.length === 0) return [];

  const nuevasFilas = empleados.map((emp) => ({
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

  const insertadas = await querySupabase('asistencias', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(nuevasFilas),
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

      const horaIni = emp.horarios?.hora_entrada?.slice(0, 5) || '08:00';
      const horaFin = emp.horarios?.hora_salida?.slice(0, 5) || '17:00';
      const checkIn = asist?.hora_entrada?.slice(0, 5) || null;
      const checkOut = asist?.hora_salida?.slice(0, 5) || (checkIn ? 'En curso' : null);
      const horarioDesc = emp.horarios?.descripcion || 'Turno Mañana';

      employees.push({
        id: emp.id,
        name: `${emp.nombre} ${emp.apellido}`.trim(),
        department: emp.departamentos?.nombre || 'Operaciones',
        role: emp.cargo || 'Colaborador',
        shift: horarioDesc,
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
        name: `${emp.nombre} ${emp.apellido}`.trim(),
        department: emp.departamentos?.nombre || 'Operaciones',
        shift: horarioDesc,
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
    const { action, employeeId, time } = await req.json();
    if (!employeeId) return NextResponse.json({ ok: false, error: 'employeeId requerido' }, { status: 400 });

    const idEmpresa = resolverIdEmpresa(req);
    const fechaHoy = obtenerFechaHoyPeru();
    const horaActual = time || obtenerHoraActualPeru();

    const empData = await querySupabase<any[]>(
      `empleados?id=eq.${employeeId}&select=id,id_empresa,nombre,apellido,horarios(hora_entrada,hora_salida,tolerancia_minutos)&limit=1`
    );
    const empleado = Array.isArray(empData) && empData[0] ? empData[0] : null;
    if (!empleado) return NextResponse.json({ ok: false, error: 'Empleado no encontrado' }, { status: 404 });

    const idEmpresaFinal = empleado.id_empresa || idEmpresa;

    const asistHoy = await querySupabase<any[]>(
      `asistencias?id_empleado=eq.${employeeId}&fecha=eq.${fechaHoy}&limit=1`
    );
    const asistenciaExistente = Array.isArray(asistHoy) && asistHoy[0] ? asistHoy[0] : null;

    if (action === 'check-in') {
      if (asistenciaExistente?.hora_entrada) {
        return NextResponse.json(
          { ok: false, error: `${empleado.nombre} ${empleado.apellido} ya registró su entrada hoy a las ${asistenciaExistente.hora_entrada.slice(0, 5)}.` },
          { status: 400 }
        );
      }

      const horario = Array.isArray(empleado.horarios) ? empleado.horarios[0] : empleado.horarios;
      const evaluacion = evaluarReglaEntrada(horario, horaActual, `${empleado.nombre} ${empleado.apellido}`);
      if (!evaluacion.permitida) {
        return NextResponse.json({ ok: false, error: evaluacion.error || 'Ingreso fuera de horario.' }, { status: 400 });
      }

      const payload = {
        hora_entrada: horaActual,
        hora_salida: null,
        horas_trabajadas: null,
        estado: evaluacion.estado,
        minutos_tardanza: evaluacion.minutosTardanza,
        metodo: 'MANUAL',
        punto_acceso: 'Control Manual / Web',
        observacion: evaluacion.observacion,
      };

      const res = asistenciaExistente
        ? await querySupabase(`asistencias?id=eq.${asistenciaExistente.id}`, {
            method: 'PATCH',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify(payload),
          })
        : await querySupabase(`asistencias`, {
            method: 'POST',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify({ id_empresa: idEmpresaFinal, id_empleado: employeeId, fecha: fechaHoy, ...payload }),
          });

      return NextResponse.json({
        ok: true,
        mensaje: `Entrada de ${empleado.nombre} ${empleado.apellido} registrada hoy a las ${horaActual.slice(0, 5)}.`,
        data: Array.isArray(res) ? res[0] : res,
      });
    }

    if (action === 'check-out') {
      if (!asistenciaExistente?.hora_entrada) {
        return NextResponse.json(
          { ok: false, error: `No se puede registrar salida: ${empleado.nombre} ${empleado.apellido} aún no ha registrado entrada hoy.` },
          { status: 400 }
        );
      }
      if (asistenciaExistente.hora_salida) {
        return NextResponse.json(
          { ok: false, error: `${empleado.nombre} ${empleado.apellido} ya registró su salida hoy a las ${asistenciaExistente.hora_salida.slice(0, 5)}.` },
          { status: 400 }
        );
      }

      const { horasDecimal } = calcularHorasTrabajadas(asistenciaExistente.hora_entrada, horaActual);
      const res = await querySupabase(`asistencias?id=eq.${asistenciaExistente.id}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ hora_salida: horaActual, horas_trabajadas: horasDecimal }),
      });

      return NextResponse.json({
        ok: true,
        mensaje: `Salida de ${empleado.nombre} ${empleado.apellido} registrada hoy a las ${horaActual.slice(0, 5)}.`,
        data: Array.isArray(res) ? res[0] : res,
      });
    }

    return NextResponse.json({ ok: false, error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
