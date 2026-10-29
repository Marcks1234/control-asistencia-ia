import { NextRequest, NextResponse } from 'next/server';
import { querySupabase } from '@/lib/supabase';
import { hashearContrasena, generarTokenJWT } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const { correo, password } = await req.json();
    if (!correo?.trim() || !password) {
      return NextResponse.json({ ok: false, error: 'Correo y contraseña son obligatorios.' }, { status: 400 });
    }

    const emailNorm = correo.trim().toLowerCase();
    const usuarios = await querySupabase<any[]>(
      `usuarios?correo=eq.${encodeURIComponent(emailNorm)}&select=id,id_empresa,nombre,apellido,correo,contrasena_hash,rol,activo&limit=1`
    );

    const usuario = Array.isArray(usuarios) && usuarios[0] ? usuarios[0] : null;
    if (!usuario) return NextResponse.json({ ok: false, error: 'No existe una cuenta con este correo.' }, { status: 401 });
    if (!usuario.activo) return NextResponse.json({ ok: false, error: 'Esta cuenta se encuentra inactiva.' }, { status: 403 });

    const hashCalculado = hashearContrasena(password);
    const esValida = password === usuario.contrasena_hash || hashCalculado === usuario.contrasena_hash;
    if (!esValida) return NextResponse.json({ ok: false, error: 'Contraseña incorrecta.' }, { status: 401 });

    const empresas = await querySupabase<any[]>(
      `empresas?id=eq.${usuario.id_empresa}&select=id,nombre,ruc,ciudad&limit=1`
    );
    const empresa = Array.isArray(empresas) && empresas[0] ? empresas[0] : null;
    const nombreEmpresa = empresa?.nombre || 'Mi Empresa';

    const token = generarTokenJWT({
      sub: usuario.id,
      id_empresa: usuario.id_empresa,
      correo: usuario.correo,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol,
      empresa_nombre: nombreEmpresa,
    });

    const response = NextResponse.json({
      ok: true,
      mensaje: 'Inicio de sesión exitoso.',
      token,
      data: {
        token,
        usuario: { id: usuario.id, id_empresa: usuario.id_empresa, nombre: usuario.nombre, apellido: usuario.apellido, correo: usuario.correo, rol: usuario.rol },
        empresa: empresa || { id: usuario.id_empresa, nombre: nombreEmpresa },
      },
    });

    response.cookies.set('asistencia_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
