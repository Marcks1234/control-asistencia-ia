import { NextRequest, NextResponse } from 'next/server';
import { querySupabase, resolverIdEmpresa, resolverContextoEmpresa, esUuidValido, detectarInyeccionSQL } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const idEmpresa = resolverIdEmpresa(req);
    const horarios = await querySupabase<any[]>(`horarios?id_empresa=eq.${idEmpresa}&activo=eq.true&order=created_at.asc`);
    return NextResponse.json({ ok: true, turnos: Array.isArray(horarios) ? horarios : [] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { descripcion, hora_entrada, hora_salida, dias = 'Lunes a Viernes', tolerancia_minutos = 10, id_empresa: bodyEmpresaId } = (await req.json()) || {};
    if (!descripcion?.trim() || !hora_entrada || !hora_salida) {
      return NextResponse.json({ ok: false, error: 'Descripción, entrada y salida son obligatorios.' }, { status: 400 });
    }
    if (detectarInyeccionSQL(descripcion) || detectarInyeccionSQL(dias)) {
      return NextResponse.json({ ok: false, error: 'Entrada no permitida.' }, { status: 400 });
    }

    const { idEmpresa: ctxEmpresa } = resolverContextoEmpresa(req, bodyEmpresaId);
    const idEmpresa = ctxEmpresa || bodyEmpresaId || '11111111-1111-1111-1111-111111111111';
    const hEntrada = hora_entrada.length === 5 ? `${hora_entrada}:00` : hora_entrada;
    const hSalida = hora_salida.length === 5 ? `${hora_salida}:00` : hora_salida;

    const res = await querySupabase<any[]>('horarios', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ id_empresa: idEmpresa, descripcion: descripcion.trim(), dias: dias.trim(), hora_entrada: hEntrada, hora_salida: hSalida, tolerancia_minutos: Number(tolerancia_minutos) || 10, activo: true }),
    });

    const creado = Array.isArray(res) && res[0] ? res[0] : null;
    return creado
      ? NextResponse.json({ ok: true, turno: creado, mensaje: `Turno "${creado.descripcion}" creado.` })
      : NextResponse.json({ ok: false, error: 'No se pudo crear el turno.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id || !esUuidValido(id)) return NextResponse.json({ ok: false, error: 'ID inválido.' }, { status: 400 });

    await querySupabase(`empleados?id_horario=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ id_horario: null }) });
    await querySupabase(`horarios?id=eq.${id}`, { method: 'DELETE' });
    return NextResponse.json({ ok: true, mensaje: 'Turno eliminado correctamente.' });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
