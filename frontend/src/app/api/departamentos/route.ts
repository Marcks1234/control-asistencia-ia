import { NextRequest, NextResponse } from 'next/server';
import { querySupabase, resolverIdEmpresa, resolverContextoEmpresa, esUuidValido, detectarInyeccionSQL } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const idEmpresa = resolverIdEmpresa(req);
    const data = await querySupabase<any[]>(`departamentos?id_empresa=eq.${idEmpresa}&activo=eq.true&order=nombre.asc`);
    return NextResponse.json({ ok: true, departamentos: Array.isArray(data) ? data : [] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, id_empresa: bodyEmpresaId } = (await req.json()) || {};
    if (!nombre?.trim()) return NextResponse.json({ ok: false, error: 'El nombre es obligatorio.' }, { status: 400 });
    if (detectarInyeccionSQL(nombre)) return NextResponse.json({ ok: false, error: 'Entrada no permitida.' }, { status: 400 });

    const { idEmpresa: ctxEmpresa } = resolverContextoEmpresa(req, bodyEmpresaId);
    const idEmpresa = ctxEmpresa || bodyEmpresaId || '11111111-1111-1111-1111-111111111111';

    const res = await querySupabase<any[]>('departamentos', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ id_empresa: idEmpresa, nombre: nombre.trim(), activo: true }),
    });

    const creado = Array.isArray(res) && res[0] ? res[0] : null;
    return creado
      ? NextResponse.json({ ok: true, departamento: creado, mensaje: `Departamento "${creado.nombre}" creado.` })
      : NextResponse.json({ ok: false, error: 'No se pudo crear el departamento.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id || !esUuidValido(id)) return NextResponse.json({ ok: false, error: 'ID inválido.' }, { status: 400 });

    await querySupabase(`empleados?id_departamento=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ id_departamento: null }),
    });
    await querySupabase(`departamentos?id=eq.${id}`, { method: 'DELETE' });

    return NextResponse.json({ ok: true, mensaje: 'Departamento eliminado.' });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

