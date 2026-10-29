import { NextRequest, NextResponse } from 'next/server';
import { querySupabase, resolverContextoEmpresa, esUuidValido } from '@/lib/supabase';
import { obtenerFechaHoyPeru } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { idEmpleado, motivo, id_empresa: bodyEmpresaId } = (await req.json()) || {};
    if (!idEmpleado || !esUuidValido(idEmpleado)) {
      return NextResponse.json({ ok: false, error: 'ID de empleado inválido.' }, { status: 400 });
    }

    const { idEmpresa: ctxEmpresa, idUsuario } = resolverContextoEmpresa(req, bodyEmpresaId);
    const fechaHoy = obtenerFechaHoyPeru();
    const observacion = motivo || 'Justificación aprobada por Gerencia RRHH';

    const empData = await querySupabase<any[]>(`empleados?id=eq.${idEmpleado}&select=id,id_empresa,nombre,apellido&limit=1`);
    const empleado = Array.isArray(empData) && empData[0] ? empData[0] : null;
    const idEmpresa = ctxEmpresa || empleado?.id_empresa || bodyEmpresaId;
    if (!idEmpresa) return NextResponse.json({ ok: false, error: 'Empresa no encontrada.' }, { status: 400 });

    const asistHoy = await querySupabase<any[]>(`asistencias?id_empleado=eq.${idEmpleado}&fecha=eq.${fechaHoy}&limit=1`);
    const existente = Array.isArray(asistHoy) && asistHoy[0] ? asistHoy[0] : null;

    if (existente) {
      await querySupabase(`asistencias?id=eq.${existente.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: 'JUSTIFICADO', observacion }),
      });
    } else {
      await querySupabase('asistencias', {
        method: 'POST',
        body: JSON.stringify({
          id_empresa: idEmpresa,
          id_empleado: idEmpleado,
          fecha: fechaHoy,
          estado: 'JUSTIFICADO',
          metodo: 'MANUAL',
          punto_acceso: 'Asistente IA',
          observacion,
        }),
      });
    }

    if (idUsuario) {
      querySupabase('solicitudes_permiso', {
        method: 'POST',
        body: JSON.stringify({
          id_empresa: idEmpresa,
          id_empleado: idEmpleado,
          id_usuario_aprobador: idUsuario,
          fecha_inicio: fechaHoy,
          fecha_fin: fechaHoy,
          motivo: observacion,
          estado: 'APROBADO',
        }),
      }).catch(() => {});
    }

    // Sincronizar tarjetas en el historial reciente
    const historial = await querySupabase<any[]>(`historial_chat?id_empresa=eq.${idEmpresa}&order=fecha.desc&limit=20`);
    if (Array.isArray(historial)) {
      for (const h of historial) {
        if (!h.metadata) continue;
        let actualizado = false;
        const meta = { ...h.metadata };
        if (meta.empleado?.id === idEmpleado) { meta.empleado.estado = 'JUSTIFICADO'; actualizado = true; }
        if (Array.isArray(meta.empleados)) {
          meta.empleados = meta.empleados.map((e: any) => (e.id === idEmpleado ? { ...e, estado: 'JUSTIFICADO' } : e));
          actualizado = true;
        }
        if (actualizado) {
          querySupabase(`historial_chat?id=eq.${h.id}`, { method: 'PATCH', body: JSON.stringify({ metadata: meta }) }).catch(() => {});
        }
      }
    }

    return NextResponse.json({
      ok: true,
      mensaje: `Justificación guardada para ${empleado ? `${empleado.nombre} ${empleado.apellido}` : 'colaborador'}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
