import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://txtftxqhnqxpanptiudt.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

function obtenerFechaHoyPeru(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export async function POST(req: NextRequest) {
  try {
    const { idEmpleado, motivo } = await req.json();

    if (!idEmpleado) {
      return NextResponse.json({ ok: false, error: 'idEmpleado es requerido' }, { status: 400 });
    }

    const fechaHoy = obtenerFechaHoyPeru();

    // Actualizar estado en asistencias estrictamente para el día actual (fechaHoy)
    await fetch(
      `${SUPABASE_URL}/rest/v1/asistencias?id_empleado=eq.${idEmpleado}&fecha=eq.${fechaHoy}`,
      {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: 'JUSTIFICADO',
          observacion: motivo || 'Tardanza justificada por Gerente RRHH desde Asistente IA',
        }),
      }
    );

    return NextResponse.json({
      ok: true,
      mensaje: 'Tardanza del día de hoy justificada correctamente en el sistema.',
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
