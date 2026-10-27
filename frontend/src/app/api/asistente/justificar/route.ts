import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://txtftxqhnqxpanptiudt.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const { idEmpleado, motivo } = await req.json();

    if (!idEmpleado) {
      return NextResponse.json({ ok: false, error: 'idEmpleado es requerido' }, { status: 400 });
    }

    // Actualizar estado en asistencias
    await fetch(`${SUPABASE_URL}/rest/v1/asistencias?id_empleado=eq.${idEmpleado}`, {
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
    });

    return NextResponse.json({
      ok: true,
      mensaje: 'Tardanza justificada correctamente en el sistema.',
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

