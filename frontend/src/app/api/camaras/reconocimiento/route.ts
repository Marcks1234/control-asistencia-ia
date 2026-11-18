import { NextRequest, NextResponse } from 'next/server';
import { querySupabase, resolverIdEmpresa, esUuidValido } from '@/lib/supabase';
import { obtenerFechaHoyPeru, obtenerHoraActualPeru, evaluarReglaEntrada, calcularHorasTrabajadas } from '@/lib/utils';

const segundosDesdeMedianoche = (hora: string) =>
  hora.split(':').reduce((acc, n, i) => acc + (parseInt(n, 10) || 0) * (i === 0 ? 3600 : i === 1 ? 60 : 1), 0);

async function guardarMarcacionBiometrica(
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

export async function POST(req: NextRequest) {
  try {
    const {
      employeeId,
      id_camara,
      punto_acceso = 'Cámara Biométrica',
      confianza_ia = 96.5,
      accion = 'auto',
      time,
    } = await req.json();

    if (!employeeId) {
      return NextResponse.json({ ok: false, error: 'Identificador del colaborador requerido.' }, { status: 400 });
    }

    const idEmpresa = resolverIdEmpresa(req);
    const fechaHoy = obtenerFechaHoyPeru();
    const horaActual = time || obtenerHoraActualPeru();
    const camaraUuid = esUuidValido(id_camara) ? id_camara : null;

    const empData = await querySupabase<any[]>(
      `empleados?id=eq.${employeeId}&select=id,id_empresa,nombre,apellido,cargo,codigo_biometrico,foto_url,departamentos(nombre),horarios(hora_entrada,hora_salida,tolerancia_minutos)&limit=1`
    );
    const empleado = Array.isArray(empData) && empData[0] ? empData[0] : null;
    if (!empleado) {
      return NextResponse.json({ ok: false, error: 'Colaborador no encontrado.' }, { status: 404 });
    }

    const nombreCompleto = `${empleado.nombre} ${empleado.apellido}`.trim();
    const asistHoy = await querySupabase<any[]>(`asistencias?id_empleado=eq.${employeeId}&fecha=eq.${fechaHoy}&limit=1`);
    const asistenciaExistente = Array.isArray(asistHoy) && asistHoy[0] ? asistHoy[0] : null;

    const yaRegistrado = (mensaje: string) =>
      NextResponse.json({ ok: true, yaRegistrado: true, mensaje, asistencia: asistenciaExistente, empleado });

    let operacion: 'check-in' | 'check-out' = accion === 'check-out' ? 'check-out' : 'check-in';
    if (accion === 'auto') {
      if (!asistenciaExistente?.hora_entrada) {
        operacion = 'check-in';
      } else if (!asistenciaExistente?.hora_salida) {
        if (Math.abs(segundosDesdeMedianoche(horaActual) - segundosDesdeMedianoche(asistenciaExistente.hora_entrada)) < 30) {
          return yaRegistrado(
            `Entrada de ${nombreCompleto} registrada hace unos segundos (${asistenciaExistente.hora_entrada.slice(0, 5)}). Para marcar salida inmediata, cambia la cámara a modo "Salida".`
          );
        }
        operacion = 'check-out';
      } else {
        return yaRegistrado(
          `${nombreCompleto} ya completó su jornada hoy (Entrada: ${asistenciaExistente.hora_entrada.slice(0, 5)}, Salida: ${asistenciaExistente.hora_salida.slice(0, 5)}).`
        );
      }
    }

    const baseMeta = {
      metodo: 'BIOMETRIA_FACIAL',
      punto_acceso,
      confianza_ia: Number(confianza_ia) || 96.5,
      id_camara: camaraUuid,
    };

    if (operacion === 'check-in') {
      if (asistenciaExistente?.hora_entrada) {
        return yaRegistrado(
          `${nombreCompleto} ya tiene entrada registrada hoy a las ${asistenciaExistente.hora_entrada.slice(0, 5)}. Cambia la cámara a modo "Salida" para marcar su salida.`
        );
      }

      const horario = Array.isArray(empleado.horarios) ? empleado.horarios[0] : empleado.horarios;
      const evaluacion = evaluarReglaEntrada(horario, horaActual, nombreCompleto);
      const asistencia = await guardarMarcacionBiometrica(
        asistenciaExistente?.id,
        {
          hora_entrada: horaActual,
          hora_salida: null,
          horas_trabajadas: null,
          estado: evaluacion.estado,
          minutos_tardanza: evaluacion.minutosTardanza,
          ...baseMeta,
          observacion: evaluacion.observacion || 'Marcación biométrica facial en cámara',
        },
        { id_empresa: empleado.id_empresa || idEmpresa, id_empleado: employeeId, fecha: fechaHoy }
      );

      return NextResponse.json({
        ok: true,
        tipo: evaluacion.estado === 'TARDANZA' ? 'Tardanza' : 'Entrada',
        mensaje: `Entrada biométrica de ${nombreCompleto} registrada a las ${horaActual.slice(0, 5)} (${confianza_ia}% similitud facial).`,
        asistencia,
        empleado,
      });
    }

    if (!asistenciaExistente?.hora_entrada) {
      return NextResponse.json(
        { ok: false, error: `No se puede registrar salida: ${nombreCompleto} aún no ha registrado entrada hoy.` },
        { status: 400 }
      );
    }
    if (asistenciaExistente.hora_salida) {
      return yaRegistrado(`${nombreCompleto} ya registró su salida hoy a las ${asistenciaExistente.hora_salida.slice(0, 5)}.`);
    }

    const { horasDecimal } = calcularHorasTrabajadas(asistenciaExistente.hora_entrada, horaActual);
    const asistencia = await guardarMarcacionBiometrica(asistenciaExistente.id, {
      hora_salida: horaActual,
      horas_trabajadas: horasDecimal,
      ...baseMeta,
    });

    return NextResponse.json({
      ok: true,
      tipo: 'Salida',
      mensaje: `Salida biométrica de ${nombreCompleto} registrada a las ${horaActual.slice(0, 5)} (${confianza_ia}% similitud facial).`,
      asistencia,
      empleado,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
