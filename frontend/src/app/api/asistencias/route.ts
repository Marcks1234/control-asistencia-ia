import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://txtftxqhnqxpanptiudt.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

async function querySupabase(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    console.error(`[Supabase Error] ${endpoint}:`, res.status, errorText);
    return null;
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await res.json();
  }
  return true;
}

function formatearFechaIso(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatearHoraSql(date = new Date()): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export async function GET() {
  try {
    const fechaHoy = formatearFechaIso();

    const [empleadosData, asistenciasData] = await Promise.all([
      querySupabase(
        'empleados?select=id,nombre,apellido,dni,cargo,codigo_biometrico,id_empresa,departamentos(nombre),horarios(descripcion,hora_entrada,hora_salida)&activo=eq.true&order=created_at.asc'
      ),
      querySupabase(
        `asistencias?select=id,id_empleado,fecha,hora_entrada,hora_salida,minutos_tardanza,horas_trabajadas,estado,metodo,punto_acceso,confianza_ia,observacion&order=created_at.desc`
      ),
    ]);

    const listaEmpleados = Array.isArray(empleadosData) ? empleadosData : [];
    const listaAsistencias = Array.isArray(asistenciasData) ? asistenciasData : [];

    // Mapa de asistencia de hoy (o la más reciente por empleado)
    const mapaAsistencia = new Map<string, any>();
    for (const a of listaAsistencias) {
      if (!mapaAsistencia.has(a.id_empleado)) {
        mapaAsistencia.set(a.id_empleado, a);
      }
    }

    const employees = listaEmpleados.map((emp) => {
      const asist = mapaAsistencia.get(emp.id);
      let statusUi = 'esperado';

      if (asist) {
        const est = String(asist.estado).toUpperCase();
        if (est === 'PRESENTE' || est === 'JUSTIFICADO') statusUi = 'presente';
        else if (est === 'TARDANZA') statusUi = 'tardanza';
        else if (est === 'FALTA') statusUi = 'ausente';
        else if (est === 'PERMISO') statusUi = 'permiso';
      }

      const horarioDesc = emp.horarios?.descripcion || 'Mañana';
      const horaIni = emp.horarios?.hora_entrada ? emp.horarios.hora_entrada.slice(0, 5) : '08:00';
      const horaFin = emp.horarios?.hora_salida ? emp.horarios.hora_salida.slice(0, 5) : '17:00';

      return {
        id: emp.id,
        name: `${emp.nombre} ${emp.apellido}`.trim(),
        department: emp.departamentos?.nombre || 'Operaciones',
        role: emp.cargo || 'Colaborador',
        shift: horarioDesc,
        shiftSchedule: `${horaIni} - ${horaFin}`,
        startTime: horaIni,
        status: statusUi,
      };
    });

    const records = listaEmpleados.map((emp) => {
      const asist = mapaAsistencia.get(emp.id);
      let statusUi = 'ausente';
      let checkIn: string | null = null;
      let checkOut: string | null = null;
      let hours: string | null = null;
      let note: string | null = null;
      let noteType: 'warning' | 'danger' | 'info' | undefined = undefined;

      if (asist) {
        const est = String(asist.estado).toUpperCase();
        if (est === 'PRESENTE' || est === 'JUSTIFICADO') statusUi = 'presente';
        else if (est === 'TARDANZA') statusUi = 'tardanza';
        else if (est === 'FALTA') statusUi = 'ausente';
        else if (est === 'PERMISO') statusUi = 'permiso';

        checkIn = asist.hora_entrada ? asist.hora_entrada.slice(0, 5) : null;
        if (asist.hora_salida) {
          checkOut = asist.hora_salida.slice(0, 5);
        } else if (asist.hora_entrada) {
          checkOut = 'En curso';
        }

        if (asist.horas_trabajadas && Number(asist.horas_trabajadas) > 0) {
          const numH = Number(asist.horas_trabajadas);
          const enteroH = Math.floor(numH);
          const minH = Math.round((numH - enteroH) * 60);
          hours = `${enteroH}h ${String(minH).padStart(2, '0')}m`;
        }

        if (asist.minutos_tardanza && asist.minutos_tardanza > 0) {
          note = `+${asist.minutos_tardanza} min tarde`;
          noteType = 'warning';
        } else if (est === 'JUSTIFICADO') {
          note = 'Tardanza justificada';
          noteType = 'info';
        } else if (est === 'FALTA') {
          note = asist.observacion || 'Sin aviso registrado';
          noteType = 'danger';
        } else if (asist.observacion && asist.observacion !== 'Ingreso puntual') {
          note = asist.observacion;
        }
      }

      const horarioDesc = emp.horarios?.descripcion || 'Mañana';
      const horaIni = emp.horarios?.hora_entrada ? emp.horarios.hora_entrada.slice(0, 5) : '08:00';

      return {
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
        note,
        noteType,
      };
    });

    return NextResponse.json({
      ok: true,
      employees,
      records,
    });
  } catch (error: any) {
    console.error('[GET /api/asistencias] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, employeeId, time } = await req.json();

    if (!employeeId) {
      return NextResponse.json({ ok: false, error: 'employeeId requerido' }, { status: 400 });
    }

    const fechaHoy = formatearFechaIso();
    const horaActual = time || formatearHoraSql();

    // Obtener datos del empleado y su horario
    const empData = await querySupabase(
      `empleados?id=eq.${employeeId}&select=id,id_empresa,nombre,apellido,horarios(hora_entrada,tolerancia_minutos)&limit=1`
    );
    const empleado = Array.isArray(empData) && empData[0] ? empData[0] : null;

    if (!empleado) {
      return NextResponse.json({ ok: false, error: 'Empleado no encontrado' }, { status: 404 });
    }

    const idEmpresa = empleado.id_empresa || '11111111-1111-1111-1111-111111111111';

    // Buscar si ya tiene asistencia hoy
    const asistHoy = await querySupabase(
      `asistencias?id_empleado=eq.${employeeId}&fecha=eq.${fechaHoy}&limit=1`
    );
    const asistenciaExistente = Array.isArray(asistHoy) && asistHoy[0] ? asistHoy[0] : null;

    if (action === 'check-in') {
      // Calcular si es tardanza
      let estado = 'PRESENTE';
      let minutosTardanza = 0;
      let observacion = 'Ingreso puntual (registro manual)';

      const horaEntradaProgramada = empleado.horarios?.hora_entrada || '08:00:00';
      const tolerancia = empleado.horarios?.tolerancia_minutos ?? 10;

      const [hProg, mProg] = horaEntradaProgramada.split(':').map(Number);
      const [hAct, mAct] = horaActual.split(':').map(Number);

      const minProg = hProg * 60 + mProg;
      const minAct = hAct * 60 + mAct;
      const diferencia = minAct - minProg;

      if (diferencia > tolerancia) {
        estado = 'TARDANZA';
        minutosTardanza = diferencia;
        observacion = `Tardanza registrada manualmente (+${diferencia} min)`;
      }

      let resultadoAsistencia;
      if (asistenciaExistente) {
        // Actualizar asistencia existente
        resultadoAsistencia = await querySupabase(
          `asistencias?id=eq.${asistenciaExistente.id}`,
          {
            method: 'PATCH',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify({
              hora_entrada: horaActual,
              estado,
              minutos_tardanza: minutosTardanza,
              metodo: 'MANUAL',
              punto_acceso: 'Control Manual / Web',
              observacion,
            }),
          }
        );
      } else {
        // Insertar nueva asistencia
        resultadoAsistencia = await querySupabase(`asistencias`, {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({
            id_empresa: idEmpresa,
            id_empleado: employeeId,
            fecha: fechaHoy,
            hora_entrada: horaActual,
            estado,
            minutos_tardanza: minutosTardanza,
            metodo: 'MANUAL',
            punto_acceso: 'Control Manual / Web',
            observacion,
          }),
        });
      }

      return NextResponse.json({
        ok: true,
        mensaje: `Entrada registrada a las ${horaActual.slice(0, 5)}`,
        data: Array.isArray(resultadoAsistencia) ? resultadoAsistencia[0] : resultadoAsistencia,
      });
    }

    if (action === 'check-out') {
      let horasTrabajadas = '8.00';
      if (asistenciaExistente && asistenciaExistente.hora_entrada) {
        const [hEnt, mEnt] = asistenciaExistente.hora_entrada.split(':').map(Number);
        const [hSal, mSal] = horaActual.split(':').map(Number);
        const diffMin = (hSal * 60 + mSal) - (hEnt * 60 + mEnt);
        if (diffMin > 0) {
          horasTrabajadas = (diffMin / 60).toFixed(2);
        }
      }

      let resultadoAsistencia;
      if (asistenciaExistente) {
        resultadoAsistencia = await querySupabase(
          `asistencias?id=eq.${asistenciaExistente.id}`,
          {
            method: 'PATCH',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify({
              hora_salida: horaActual,
              horas_trabajadas: horasTrabajadas,
              observacion: asistenciaExistente.observacion
                ? `${asistenciaExistente.observacion} - Salida registrada manualmente`
                : 'Salida registrada manualmente',
            }),
          }
        );
      } else {
        resultadoAsistencia = await querySupabase(`asistencias`, {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({
            id_empresa: idEmpresa,
            id_empleado: employeeId,
            fecha: fechaHoy,
            hora_salida: horaActual,
            horas_trabajadas: horasTrabajadas,
            estado: 'PRESENTE',
            metodo: 'MANUAL',
            punto_acceso: 'Control Manual / Web',
            observacion: 'Salida registrada manualmente',
          }),
        });
      }

      return NextResponse.json({
        ok: true,
        mensaje: `Salida registrada a las ${horaActual.slice(0, 5)}`,
        data: Array.isArray(resultadoAsistencia) ? resultadoAsistencia[0] : resultadoAsistencia,
      });
    }

    return NextResponse.json({ ok: false, error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    console.error('[POST /api/asistencias] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

