import { NextRequest, NextResponse } from 'next/server';
import { querySupabase, resolverContextoEmpresa } from '@/lib/supabase';
import { obtenerFechaHoyPeru } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const { idEmpresa } = resolverContextoEmpresa(req);
    const fechaHoy = obtenerFechaHoyPeru();

    const [empleados, asistencias, historial] = await Promise.all([
      querySupabase<any[]>(
        `empleados?id_empresa=eq.${idEmpresa}&select=id,nombre,apellido,codigo_biometrico,cargo,punto_acceso_habitual&activo=eq.true`
      ),
      querySupabase<any[]>(
        `asistencias?id_empresa=eq.${idEmpresa}&fecha=eq.${fechaHoy}&select=id_empleado,fecha,hora_entrada,minutos_tardanza,estado,punto_acceso,confianza_ia,observacion&order=created_at.desc`
      ),
      querySupabase<any[]>(
        `historial_chat?id_empresa=eq.${idEmpresa}&select=id,mensaje,respuesta,metadata,fecha&order=fecha.asc&limit=50`
      ),
    ]);

    const listaEmpleados = Array.isArray(empleados) ? empleados : [];
    const listaAsistencias = Array.isArray(asistencias) ? asistencias : [];

    let presentes = 0;
    let tardanzas = 0;
    let ausentes = 0;

    const mapa = new Map<string, any>();
    for (const a of listaAsistencias) {
      if (!mapa.has(a.id_empleado)) mapa.set(a.id_empleado, a);
    }

    for (const emp of listaEmpleados) {
      const a = mapa.get(emp.id);
      const est = a?.estado ? String(a.estado).toUpperCase() : 'FALTA';
      if (est === 'FALTA') ausentes++;
      else if (est === 'TARDANZA') tardanzas++;
      else presentes++;
    }

    const total = listaEmpleados.length;
    const puntualidad = total > 0 ? Math.round((presentes / total) * 100) : 100;

    return NextResponse.json({
      ok: true,
      resumen: {
        presentes,
        tardanzas,
        ausentes,
        total_plantilla: total,
        puntualidad_semanal: `${puntualidad}%`,
      },
      historial: Array.isArray(historial) ? historial : [],
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { idEmpresa } = resolverContextoEmpresa(req);
    await querySupabase(`historial_chat?id_empresa=eq.${idEmpresa}`, { method: 'DELETE' });
    return NextResponse.json({ ok: true, mensaje: 'Historial eliminado.' });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
