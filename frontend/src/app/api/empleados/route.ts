import { NextRequest, NextResponse } from 'next/server';
import { querySupabase, resolverIdEmpresa, resolverContextoEmpresa, esUuidValido, detectarInyeccionSQL } from '@/lib/supabase';
import { obtenerFechaHoyPeru } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const idEmpresa = resolverIdEmpresa(req);
    const [empleados, departamentos, horarios] = await Promise.all([
      querySupabase<any[]>(`empleados?id_empresa=eq.${idEmpresa}&select=id,nombre,apellido,dni,cargo,codigo_biometrico,id_departamento,id_horario,departamentos(nombre),horarios(id,descripcion,hora_entrada,hora_salida)&activo=eq.true&order=created_at.asc`),
      querySupabase<any[]>(`departamentos?id_empresa=eq.${idEmpresa}&select=id,nombre&activo=eq.true&order=nombre.asc`),
      querySupabase<any[]>(`horarios?id_empresa=eq.${idEmpresa}&select=id,descripcion,hora_entrada,hora_salida,dias,tolerancia_minutos&activo=eq.true&order=created_at.asc`),
    ]);
    return NextResponse.json({
      ok: true,
      empleados: Array.isArray(empleados) ? empleados : [],
      departamentos: Array.isArray(departamentos) ? departamentos : [],
      horarios: Array.isArray(horarios) ? horarios : [],
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, apellido, dni, cargo = 'Colaborador', id_departamento, id_horario, id_empresa: bodyEmpresaId } = (await req.json()) || {};
    if (!nombre?.trim() || !apellido?.trim() || !dni?.trim()) {
      return NextResponse.json({ ok: false, error: 'Nombre, apellido y DNI son obligatorios.' }, { status: 400 });
    }
    if ([nombre, apellido, dni, cargo].some(detectarInyeccionSQL)) {
      return NextResponse.json({ ok: false, error: 'Entrada no permitida.' }, { status: 400 });
    }

    const { idEmpresa: ctxEmpresa } = resolverContextoEmpresa(req, bodyEmpresaId);
    const idEmpresa = ctxEmpresa || bodyEmpresaId || '11111111-1111-1111-1111-111111111111';

    let idHorarioFinal = id_horario;
    if (!idHorarioFinal) {
      const turnos = await querySupabase<any[]>(`horarios?id_empresa=eq.${idEmpresa}&activo=eq.true&limit=1`);
      idHorarioFinal = Array.isArray(turnos) && turnos[0] ? turnos[0].id : null;
    }

    const cleanDni = String(dni).trim();
    const codigoBiometrico = `BIO-${cleanDni.slice(-4) || Math.floor(1000 + Math.random() * 9000)}`;

    const res = await querySupabase<any[]>('empleados', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        id_empresa: idEmpresa,
        id_departamento: id_departamento || null,
        id_horario: idHorarioFinal,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: cleanDni,
        cargo: cargo.trim(),
        codigo_biometrico: codigoBiometrico,
        punto_acceso_habitual: 'Acceso Principal',
        activo: true,
      }),
    });

    const creado = Array.isArray(res) && res[0] ? res[0] : null;
    if (!creado) return NextResponse.json({ ok: false, error: 'Error al crear empleado.' }, { status: 400 });

    const fechaHoy = obtenerFechaHoyPeru();
    querySupabase('asistencias', {
      method: 'POST',
      body: JSON.stringify({
        id_empresa: idEmpresa,
        id_empleado: creado.id,
        fecha: fechaHoy,
        estado: 'FALTA',
        metodo: 'SISTEMA',
        punto_acceso: 'Sin registro',
        observacion: 'Nuevo colaborador registrado',
      }),
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      empleado: creado,
      mensaje: `Colaborador ${creado.nombre} ${creado.apellido} (${codigoBiometrico}) registrado.`,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { idEmpleado, id_horario, id_departamento } = (await req.json()) || {};
    if (!idEmpleado || !esUuidValido(idEmpleado)) return NextResponse.json({ ok: false, error: 'ID inválido.' }, { status: 400 });

    const updates: Record<string, any> = {};
    if (id_horario !== undefined) updates.id_horario = id_horario || null;
    if (id_departamento !== undefined) updates.id_departamento = id_departamento || null;

    const res = await querySupabase(`empleados?id=eq.${idEmpleado}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(updates),
    });

    return NextResponse.json({ ok: true, mensaje: 'Turno actualizado.', empleado: Array.isArray(res) ? res[0] : res });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id || !esUuidValido(id)) return NextResponse.json({ ok: false, error: 'ID inválido.' }, { status: 400 });

    await querySupabase(`asistencias?id_empleado=eq.${id}`, { method: 'DELETE' });
    await querySupabase(`empleados?id=eq.${id}`, { method: 'DELETE' });
    return NextResponse.json({ ok: true, mensaje: 'Colaborador eliminado.' });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
