import { NextRequest, NextResponse } from 'next/server';
import { querySupabase } from '@/lib/supabase';
import { hashearContrasena, generarTokenJWT } from '@/lib/jwt';
import { obtenerFechaHoyPeru } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { nombreEmpresa, ruc, telefono = '', ciudad = 'Lima', nombreGerente, apellidoGerente, correo, password, idPlan } = await req.json();

    if (!nombreEmpresa?.trim()) return NextResponse.json({ ok: false, error: 'El nombre de empresa es obligatorio.' }, { status: 400 });
    if (!ruc?.trim() || !/^\d{11}$/.test(ruc.trim())) return NextResponse.json({ ok: false, error: 'El RUC debe tener 11 dígitos.' }, { status: 400 });
    if (!nombreGerente?.trim() || !apellidoGerente?.trim()) return NextResponse.json({ ok: false, error: 'Nombre y apellido son obligatorios.' }, { status: 400 });
    if (!correo?.trim() || !correo.includes('@')) return NextResponse.json({ ok: false, error: 'Correo inválido.' }, { status: 400 });
    if (!password || password.length < 6) return NextResponse.json({ ok: false, error: 'Contraseña mín. 6 caracteres.' }, { status: 400 });

    const emailNorm = correo.trim().toLowerCase();
    const rucNorm = ruc.trim();

    const [empCheck, usrCheck] = await Promise.all([
      querySupabase<any[]>(`empresas?ruc=eq.${rucNorm}&select=id&limit=1`),
      querySupabase<any[]>(`usuarios?correo=eq.${encodeURIComponent(emailNorm)}&select=id&limit=1`),
    ]);

    if (Array.isArray(empCheck) && empCheck.length > 0) return NextResponse.json({ ok: false, error: `El RUC ${rucNorm} ya está registrado.` }, { status: 400 });
    if (Array.isArray(usrCheck) && usrCheck.length > 0) return NextResponse.json({ ok: false, error: `El correo ${emailNorm} ya está registrado.` }, { status: 400 });

    let planIdFinal = idPlan;
    if (!planIdFinal) {
      const planes = await querySupabase<any[]>('planes?es_recomendado=eq.true&select=id&limit=1');
      if (Array.isArray(planes) && planes[0]?.id) planIdFinal = planes[0].id;
    }

    const nuevaEmpresa = await querySupabase<any[]>('empresas', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ nombre: nombreEmpresa.trim(), ruc: rucNorm, telefono: telefono.trim(), ciudad: ciudad.trim() || 'Lima', activo: true }),
    });

    const empresa = Array.isArray(nuevaEmpresa) && nuevaEmpresa[0] ? nuevaEmpresa[0] : null;
    if (!empresa) throw new Error('Error al registrar empresa.');

    await querySupabase('configuraciones_empresa', {
      method: 'POST',
      body: JSON.stringify({ id_empresa: empresa.id, tolerancia_global_minutos: 15, umbral_confianza_ia: 0.60, precision_minima_ia: 95.0 }),
    });

    if (planIdFinal) {
      const hoy = obtenerFechaHoyPeru();
      await querySupabase('suscripciones', {
        method: 'POST',
        body: JSON.stringify({ id_empresa: empresa.id, id_plan: planIdFinal, estado: 'PRUEBA', fecha_inicio: hoy, fecha_fin: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) }),
      });
    }

    const nuevoUsuario = await querySupabase<any[]>('usuarios', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ id_empresa: empresa.id, nombre: nombreGerente.trim(), apellido: apellidoGerente.trim(), correo: emailNorm, contrasena_hash: hashearContrasena(password), rol: 'GERENTE', activo: true }),
    });

    const usuario = Array.isArray(nuevoUsuario) && nuevoUsuario[0] ? nuevoUsuario[0] : null;
    if (!usuario) throw new Error('Error al registrar usuario gerente.');

    try {
      const [depData, horData] = await Promise.all([
        querySupabase<any[]>('departamentos', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ id_empresa: empresa.id, nombre: 'Operaciones' }) }),
        querySupabase<any[]>('horarios', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ id_empresa: empresa.id, descripcion: 'Turno Mañana', dias: 'Lunes a Viernes', hora_entrada: '08:00:00', hora_salida: '17:00:00', tolerancia_minutos: 10, activo: true }) }),
      ]);

      const idDep = depData?.[0]?.id;
      const idHor = horData?.[0]?.id;

      if (idDep && idHor) {
        const empInsert = await querySupabase<any[]>('empleados', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify([
            { id_empresa: empresa.id, id_departamento: idDep, id_horario: idHor, nombre: 'Alejandro', apellido: 'Mendoza', dni: `${Math.floor(10000000 + Math.random() * 90000000)}`, cargo: 'Supervisor de Operaciones', codigo_biometrico: `BIO-${Math.floor(1000 + Math.random() * 9000)}`, activo: true },
            { id_empresa: empresa.id, id_departamento: idDep, id_horario: idHor, nombre: 'Valeria', apellido: 'Ríos', dni: `${Math.floor(10000000 + Math.random() * 90000000)}`, cargo: 'Analista de Procesos', codigo_biometrico: `BIO-${Math.floor(1000 + Math.random() * 9000)}`, activo: true },
            { id_empresa: empresa.id, id_departamento: idDep, id_horario: idHor, nombre: 'Renato', apellido: 'Castro', dni: `${Math.floor(10000000 + Math.random() * 90000000)}`, cargo: 'Coordinador de Calidad', codigo_biometrico: `BIO-${Math.floor(1000 + Math.random() * 9000)}`, activo: true },
          ]),
        });

        if (Array.isArray(empInsert) && empInsert.length >= 3) {
          const hoyStr = obtenerFechaHoyPeru();
          await querySupabase('asistencias', {
            method: 'POST',
            body: JSON.stringify([
              { id_empresa: empresa.id, id_empleado: empInsert[0].id, fecha: hoyStr, hora_entrada: '07:55:00', estado: 'PRESENTE', minutos_tardanza: 0, metodo: 'BIOMETRICO_IA', punto_acceso: 'Torniquete Central', confianza_ia: 98.8, observacion: 'Ingreso puntual' },
              { id_empresa: empresa.id, id_empleado: empInsert[1].id, fecha: hoyStr, hora_entrada: '08:18:00', estado: 'TARDANZA', minutos_tardanza: 18, metodo: 'BIOMETRICO_IA', punto_acceso: 'Torniquete Central', confianza_ia: 99.1, observacion: '+18 min tarde' },
              { id_empresa: empresa.id, id_empleado: empInsert[2].id, fecha: hoyStr, hora_entrada: null, estado: 'FALTA', minutos_tardanza: 0, metodo: 'SISTEMA', punto_acceso: 'Sin registro', observacion: 'Sin marcación' },
            ]),
          });
        }
      }
    } catch {}

    const token = generarTokenJWT({ sub: usuario.id, id_empresa: empresa.id, correo: usuario.correo, nombre: usuario.nombre, apellido: usuario.apellido, rol: usuario.rol, empresa_nombre: empresa.nombre });

    const response = NextResponse.json({
      ok: true,
      mensaje: 'Registro completado con éxito.',
      token,
      data: { token, usuario: { id: usuario.id, id_empresa: empresa.id, nombre: usuario.nombre, apellido: usuario.apellido, correo: usuario.correo, rol: usuario.rol }, empresa: { id: empresa.id, nombre: empresa.nombre, ruc: empresa.ruc } },
    });

    response.cookies.set('asistencia_token', token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 });
    return response;
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
