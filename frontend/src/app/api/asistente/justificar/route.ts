import { NextRequest, NextResponse } from 'next/server';
import { querySupabase, resolverContextoEmpresa } from '@/lib/supabase';
import { obtenerFechaHoyPeru } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { idEmpleado, motivo } = await req.json();
    if (!idEmpleado) return NextResponse.json({ ok: false, error: 'idEmpleado es requerido.' }, { status: 400 });

    const { idEmpresa, idUsuario } = resolverContextoEmpresa(req);
    const fechaHoy = obtenerFechaHoyPeru();
    const observacionMotivo = motivo || 'Tardanza justificada por Gerencia RRHH';

    await querySupabase(
      `asistencias?id_empresa=eq.${idEmpresa}&id_empleado=eq.${idEmpleado}&fecha=eq.${fechaHoy}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ estado: 'JUSTIFICADO', observacion: observacionMotivo }),
      }
    );

    if (idUsuario) {
      await querySupabase('solicitudes_permiso', {
        method: 'POST',
        body: JSON.stringify({
          id_empresa: idEmpresa,
          id_empleado: idEmpleado,
          id_usuario_aprobador: idUsuario,
          fecha_inicio: fechaHoy,
          fecha_fin: fechaHoy,
          motivo: observacionMotivo,
          estado: 'APROBADO',
        }),
      });
    }

    return NextResponse.json({ ok: true, mensaje: 'Tardanza justificada correctamente.' });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
