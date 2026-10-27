import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://txtftxqhnqxpanptiudt.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

async function querySupabase(endpoint: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return await res.json();
}

export async function GET() {
  try {
    const [empleados, asistencias, historial, usuarios] = await Promise.all([
      querySupabase('empleados?select=id,nombre,apellido,codigo_biometrico,cargo,punto_acceso_habitual&activo=eq.true'),
      querySupabase('asistencias?select=id_empleado,fecha,hora_entrada,minutos_tardanza,estado,punto_acceso,confianza_ia,observacion&order=created_at.desc'),
      querySupabase('historial_chat?select=id,mensaje,respuesta,metadata,fecha&order=fecha.asc&limit=50'),
      querySupabase('usuarios?select=nombre,apellido,cargo&activo=eq.true&limit=1'),
    ]);

    const listaEmpleados = Array.isArray(empleados) ? empleados : [];
    const listaAsistencias = Array.isArray(asistencias) ? asistencias : [];

    // Tomar la última asistencia registrada por cada empleado activo
    const mapaAsistencia = new Map<string, any>();
    for (const a of listaAsistencias) {
      if (!mapaAsistencia.has(a.id_empleado)) {
        mapaAsistencia.set(a.id_empleado, a);
      }
    }

    let presentes = 0;
    let tardanzas = 0;
    let ausentes = 0;

    for (const emp of listaEmpleados) {
      const reg = mapaAsistencia.get(emp.id);
      if (!reg || reg.estado === 'FALTA') {
        ausentes++;
      } else if (reg.estado === 'TARDANZA') {
        tardanzas++;
      } else {
        presentes++;
      }
    }

    const usuaria = Array.isArray(usuarios) && usuarios[0] ? usuarios[0].nombre : 'Sarah';

    return NextResponse.json({
      ok: true,
      usuaria,
      resumen: {
        presentes,
        tardanzas,
        ausentes,
        total_plantilla: listaEmpleados.length,
      },
      historial: Array.isArray(historial) ? historial : [],
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/historial_chat?id_empresa=eq.11111111-1111-1111-1111-111111111111`,
      {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    return NextResponse.json({ ok: true, mensaje: 'Historial limpiado correctamente' });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
