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

/**
 * Obtiene la fecha actual exacta en zona horaria de Perú (YYYY-MM-DD)
 */
function obtenerFechaHoyPeru(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Obtiene la hora actual exacta en zona horaria de Perú (HH:MM:SS)
 */
function obtenerHoraActualPeru(): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());
}

/**
 * Si inicia un nuevo día y aún no existen filas para fechaHoy, inicializa la jornada actual
 */
async function asegurarJornadaDeHoy(fechaHoy: string, empleados: any[]) {
  const asistenciasHoy = await querySupabase(
    `asistencias?fecha=eq.${fechaHoy}&select=id,id_empleado,fecha,hora_entrada,hora_salida,minutos_tardanza,horas_trabajadas,estado,metodo,punto_acceso,confianza_ia,observacion&order=created_at.desc`
  );

  if (Array.isArray(asistenciasHoy) && asistenciasHoy.length > 0) {
    return asistenciasHoy;
  }

  // Semilla diaria base para que el día actual siempre tenga datos coherentes al abrir el sistema
  if (!Array.isArray(empleados) || empleados.length === 0) return [];

  const plantillasPorCodigo: Record<string, any> = {
    'BIO-4410': {
      hora_entrada: '07:58:00',
      estado: 'PRESENTE',
      minutos_tardanza: 0,
      metodo: 'BIOMETRICO_IA',
      punto_acceso: 'Torniquete A (Cámara 01)',
      confianza_ia: 99.2,
      observacion: 'Ingreso puntual',
    },
    'BIO-3109': {
      hora_entrada: '08:00:00',
      estado: 'PRESENTE',
      minutos_tardanza: 0,
      metodo: 'BIOMETRICO_IA',
      punto_acceso: 'Recepción Central (Cámara 02)',
      confianza_ia: 98.9,
      observacion: 'Ingreso puntual',
    },
    'BIO-8812': {
      hora_entrada: '08:05:00',
      estado: 'PRESENTE',
      minutos_tardanza: 0,
      metodo: 'BIOMETRICO_IA',
      punto_acceso: 'Torniquete A (Cámara 01)',
      confianza_ia: 99.1,
      observacion: 'Ingreso puntual',
    },
    'BIO-7721': {
      hora_entrada: '08:34:00',
      estado: 'TARDANZA',
      minutos_tardanza: 34,
      metodo: 'BIOMETRICO_IA',
      punto_acceso: 'Torniquete A (Cámara 01)',
      confianza_ia: 98.4,
      observacion: 'Tráfico vehicular en Av. Javier Prado',
    },
    'BIO-9920': {
      hora_entrada: null,
      estado: 'FALTA',
      minutos_tardanza: 0,
      metodo: 'SISTEMA',
      punto_acceso: 'Sin registro',
      confianza_ia: null,
      observacion: 'Sin aviso registrado',
    },
  };

  const nuevasFilas = empleados.map((emp) => {
    const base = plantillasPorCodigo[emp.codigo_biometrico] || {
      hora_entrada: null,
      estado: 'FALTA',
      minutos_tardanza: 0,
      metodo: 'SISTEMA',
      punto_acceso: 'Sin registro',
      confianza_ia: null,
      observacion: 'Pendiente de marcación',
    };
    return {
      id_empresa: emp.id_empresa || '11111111-1111-1111-1111-111111111111',
      id_empleado: emp.id,
      fecha: fechaHoy,
      hora_entrada: base.hora_entrada,
      hora_salida: null,
      minutos_tardanza: base.minutos_tardanza,
      horas_trabajadas: null,
      estado: base.estado,
      metodo: base.metodo,
      punto_acceso: base.punto_acceso,
      confianza_ia: base.confianza_ia,
      observacion: base.observacion,
    };
  });

  const insertadas = await querySupabase('asistencias', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(nuevasFilas),
  });

  return Array.isArray(insertadas) ? insertadas : [];
}

export async function GET() {
  try {
    const fechaHoy = obtenerFechaHoyPeru();

    const empleadosData = await querySupabase(
      'empleados?select=id,nombre,apellido,dni,cargo,codigo_biometrico,id_empresa,departamentos(nombre),horarios(descripcion,hora_entrada,hora_salida)&activo=eq.true&order=created_at.asc'
    );

    const listaEmpleados = Array.isArray(empleadosData) ? empleadosData : [];
    const listaAsistencias = await asegurarJornadaDeHoy(fechaHoy, listaEmpleados);

    // Mapa de asistencia estrictamente del día actual (fechaHoy)
    const mapaAsistencia = new Map<string, any>();
    for (const a of listaAsistencias) {
      if (!mapaAsistencia.has(a.id_empleado)) {
        mapaAsistencia.set(a.id_empleado, a);
      }
    }

    const employees = listaEmpleados.map((emp) => {
      const asist = mapaAsistencia.get(emp.id);
      let statusUi: any = 'ausente';

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

      const checkIn = asist?.hora_entrada ? asist.hora_entrada.slice(0, 5) : null;
      const checkOut = asist?.hora_salida
        ? asist.hora_salida.slice(0, 5)
        : checkIn
        ? 'En curso'
        : null;

      return {
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
      };
    });

    const records = listaEmpleados.map((emp) => {
      const asist = mapaAsistencia.get(emp.id);
      let statusUi: any = 'ausente';
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

        // Solo mostrar horas cerradas cuando ya registró salida (o si tiene horas_trabajadas y hora_salida)
        if (asist.hora_salida && asist.horas_trabajadas && Number(asist.horas_trabajadas) > 0) {
          const numH = Number(asist.horas_trabajadas);
          const enteroH = Math.floor(numH);
          const minH = Math.round((numH - enteroH) * 60);
          hours = `${enteroH}h ${String(minH).padStart(2, '0')}m`;
        } else if (checkIn && !asist.hora_salida) {
          hours = 'En curso';
        }

        if (est === 'JUSTIFICADO') {
          note = 'Tardanza justificada';
          noteType = 'info';
        } else if (asist.minutos_tardanza && asist.minutos_tardanza > 0) {
          note = `+${asist.minutos_tardanza} min tarde`;
          noteType = 'warning';
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
      fecha: fechaHoy,
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

    // Siempre se opera exclusivamente sobre el día actual en tiempo real
    const fechaHoy = obtenerFechaHoyPeru();
    const horaActual = time || obtenerHoraActualPeru();

    // Obtener datos del empleado y su horario
    const empData = await querySupabase(
      `empleados?id=eq.${employeeId}&select=id,id_empresa,nombre,apellido,horarios(hora_entrada,tolerancia_minutos)&limit=1`
    );
    const empleado = Array.isArray(empData) && empData[0] ? empData[0] : null;

    if (!empleado) {
      return NextResponse.json({ ok: false, error: 'Empleado no encontrado' }, { status: 404 });
    }

    const idEmpresa = empleado.id_empresa || '11111111-1111-1111-1111-111111111111';

    // Buscar si ya tiene registro en la fecha actual (fechaHoy)
    const asistHoy = await querySupabase(
      `asistencias?id_empleado=eq.${employeeId}&fecha=eq.${fechaHoy}&limit=1`
    );
    const asistenciaExistente = Array.isArray(asistHoy) && asistHoy[0] ? asistHoy[0] : null;

    if (action === 'check-in') {
      // Regla de negocio: No puede volver a marcar entrada si ya registró entrada hoy
      if (asistenciaExistente && asistenciaExistente.hora_entrada) {
        return NextResponse.json(
          {
            ok: false,
            error: `${empleado.nombre} ${empleado.apellido} ya registró su entrada hoy a las ${asistenciaExistente.hora_entrada.slice(0, 5)}.`,
          },
          { status: 400 }
        );
      }

      // Calcular si es puntual o tardanza respecto a su horario
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
        observacion = `Ingreso con tardanza (+${diferencia} min)`;
      }

      let resultadoAsistencia;
      if (asistenciaExistente) {
        resultadoAsistencia = await querySupabase(
          `asistencias?id=eq.${asistenciaExistente.id}`,
          {
            method: 'PATCH',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify({
              hora_entrada: horaActual,
              hora_salida: null,
              horas_trabajadas: null,
              estado,
              minutos_tardanza: minutosTardanza,
              metodo: 'MANUAL',
              punto_acceso: 'Control Manual / Web',
              observacion,
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
            hora_entrada: horaActual,
            hora_salida: null,
            horas_trabajadas: null,
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
        mensaje: `Entrada de ${empleado.nombre} ${empleado.apellido} registrada hoy a las ${horaActual.slice(0, 5)}.`,
        data: Array.isArray(resultadoAsistencia) ? resultadoAsistencia[0] : resultadoAsistencia,
      });
    }

    if (action === 'check-out') {
      // Regla de negocio 1: No puede registrar salida si hoy no ha registrado entrada
      if (!asistenciaExistente || !asistenciaExistente.hora_entrada) {
        return NextResponse.json(
          {
            ok: false,
            error: `No se puede registrar salida: ${empleado.nombre} ${empleado.apellido} aún no ha registrado su entrada hoy.`,
          },
          { status: 400 }
        );
      }

      // Regla de negocio 2: No puede registrar salida dos veces el mismo día
      if (asistenciaExistente.hora_salida) {
        return NextResponse.json(
          {
            ok: false,
            error: `${empleado.nombre} ${empleado.apellido} ya registró su salida hoy a las ${asistenciaExistente.hora_salida.slice(0, 5)}.`,
          },
          { status: 400 }
        );
      }

      const [hEnt, mEnt] = asistenciaExistente.hora_entrada.split(':').map(Number);
      const [hSal, mSal] = horaActual.split(':').map(Number);
      const diffMin = Math.max(1, hSal * 60 + mSal - (hEnt * 60 + mEnt));
      const horasTrabajadas = (diffMin / 60).toFixed(2);

      const resultadoAsistencia = await querySupabase(
        `asistencias?id=eq.${asistenciaExistente.id}`,
        {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({
            hora_salida: horaActual,
            horas_trabajadas: horasTrabajadas,
          }),
        }
      );

      return NextResponse.json({
        ok: true,
        mensaje: `Salida de ${empleado.nombre} ${empleado.apellido} registrada hoy a las ${horaActual.slice(0, 5)}.`,
        data: Array.isArray(resultadoAsistencia) ? resultadoAsistencia[0] : resultadoAsistencia,
      });
    }

    return NextResponse.json({ ok: false, error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    console.error('[POST /api/asistencias] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
