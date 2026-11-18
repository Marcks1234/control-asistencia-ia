import { NextRequest, NextResponse } from 'next/server';
import { querySupabase, resolverIdEmpresa, esUuidValido } from '@/lib/supabase';
import { obtenerFechaHoyPeru, obtenerHoraActualPeru, evaluarReglaEntrada, calcularHorasTrabajadas } from '@/lib/utils';

function segundosDesdeMedianoche(hora: string): number {
  const partes = hora.split(':').map((n) => parseInt(n, 10) || 0);
  return (partes[0] || 0) * 3600 + (partes[1] || 0) * 60 + (partes[2] || 0);
}

export async function POST(req: NextRequest) {
  try {
    const {
      employeeId,
      id_camara,
      punto_acceso = 'Cámara Biométrica IA',
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

    // 1. Obtener datos del empleado y su horario
    const empData = await querySupabase<any[]>(
      `empleados?id=eq.${employeeId}&select=id,id_empresa,nombre,apellido,cargo,codigo_biometrico,foto_url,departamentos(nombre),horarios(hora_entrada,hora_salida,tolerancia_minutos)&limit=1`
    );
    const empleado = Array.isArray(empData) && empData[0] ? empData[0] : null;
    if (!empleado) {
      return NextResponse.json({ ok: false, error: 'Colaborador no encontrado.' }, { status: 404 });
    }

    const idEmpresaFinal = empleado.id_empresa || idEmpresa;
    const nombreCompleto = `${empleado.nombre} ${empleado.apellido}`.trim();

    // 2. Verificar asistencia del día
    const asistHoy = await querySupabase<any[]>(
      `asistencias?id_empleado=eq.${employeeId}&fecha=eq.${fechaHoy}&limit=1`
    );
    const asistenciaExistente = Array.isArray(asistHoy) && asistHoy[0] ? asistHoy[0] : null;

    let operacion: 'check-in' | 'check-out' = 'check-in';
    if (accion === 'check-out') {
      operacion = 'check-out';
    } else if (accion === 'check-in') {
      operacion = 'check-in';
    } else {
      // Modo 'auto': si no tiene entrada hoy -> marcar entrada; si ya tiene entrada pero no salida -> verificar margen de 30s
      if (!asistenciaExistente?.hora_entrada) {
        operacion = 'check-in';
      } else if (!asistenciaExistente?.hora_salida) {
        const segEntrada = segundosDesdeMedianoche(asistenciaExistente.hora_entrada);
        const segActual = segundosDesdeMedianoche(horaActual);
        if (Math.abs(segActual - segEntrada) < 30) {
          return NextResponse.json({
            ok: true,
            yaRegistrado: true,
            mensaje: `Entrada de ${nombreCompleto} registrada hace unos segundos (${asistenciaExistente.hora_entrada.slice(0, 5)}). Para marcar salida inmediata, cambia la cámara a modo "Salida".`,
            asistencia: asistenciaExistente,
            empleado,
          });
        }
        operacion = 'check-out';
      } else {
        return NextResponse.json({
          ok: true,
          yaRegistrado: true,
          mensaje: `${nombreCompleto} ya completó su jornada hoy (Entrada: ${asistenciaExistente.hora_entrada.slice(0, 5)}, Salida: ${asistenciaExistente.hora_salida.slice(0, 5)}).`,
          asistencia: asistenciaExistente,
          empleado,
        });
      }
    }

    if (operacion === 'check-in') {
      if (asistenciaExistente?.hora_entrada) {
        return NextResponse.json({
          ok: true,
          yaRegistrado: true,
          mensaje: `${nombreCompleto} ya tiene entrada registrada hoy a las ${asistenciaExistente.hora_entrada.slice(0, 5)}. Cambia la cámara a modo "Salida" para marcar su salida.`,
          asistencia: asistenciaExistente,
          empleado,
        });
      }

      const horario = Array.isArray(empleado.horarios) ? empleado.horarios[0] : empleado.horarios;
      const evaluacion = evaluarReglaEntrada(horario, horaActual, nombreCompleto);

      const payload = {
        hora_entrada: horaActual,
        hora_salida: null,
        horas_trabajadas: null,
        estado: evaluacion.estado,
        minutos_tardanza: evaluacion.minutosTardanza,
        metodo: 'BIOMETRIA_FACIAL',
        punto_acceso: punto_acceso,
        confianza_ia: Number(confianza_ia) || 96.5,
        id_camara: camaraUuid,
        observacion: evaluacion.observacion || 'Marcación biométrica facial por cámara IA (face-api.js)',
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

      const grabada = Array.isArray(res) ? res[0] : res;
      return NextResponse.json({
        ok: true,
        tipo: evaluacion.estado === 'TARDANZA' ? 'Tardanza' : 'Entrada',
        mensaje: `Entrada biométrica de ${nombreCompleto} registrada a las ${horaActual.slice(0, 5)} (${confianza_ia}% similitud facial).`,
        asistencia: grabada,
        empleado,
      });
    }

    if (operacion === 'check-out') {
      if (!asistenciaExistente?.hora_entrada) {
        return NextResponse.json(
          { ok: false, error: `No se puede registrar salida: ${nombreCompleto} aún no ha registrado entrada hoy.` },
          { status: 400 }
        );
      }
      if (asistenciaExistente.hora_salida) {
        return NextResponse.json({
          ok: true,
          yaRegistrado: true,
          mensaje: `${nombreCompleto} ya registró su salida hoy a las ${asistenciaExistente.hora_salida.slice(0, 5)}.`,
          asistencia: asistenciaExistente,
          empleado,
        });
      }

      const { horasDecimal } = calcularHorasTrabajadas(asistenciaExistente.hora_entrada, horaActual);
      const payloadOut = {
        hora_salida: horaActual,
        horas_trabajadas: horasDecimal,
        metodo: 'BIOMETRIA_FACIAL',
        punto_acceso: punto_acceso,
        confianza_ia: Number(confianza_ia) || 96.5,
        id_camara: camaraUuid,
      };

      const res = await querySupabase(`asistencias?id=eq.${asistenciaExistente.id}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payloadOut),
      });

      const grabada = Array.isArray(res) ? res[0] : res;
      return NextResponse.json({
        ok: true,
        tipo: 'Salida',
        mensaje: `Salida biométrica de ${nombreCompleto} registrada a las ${horaActual.slice(0, 5)} (${confianza_ia}% similitud facial).`,
        asistencia: grabada,
        empleado,
      });
    }

    return NextResponse.json({ ok: false, error: 'Acción biométrica no válida.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
