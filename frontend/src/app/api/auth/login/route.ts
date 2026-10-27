import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { generarTokenJWT } from '@/lib/jwt';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://txtftxqhnqxpanptiudt.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
const SALT = 'AsistenciaAI_B2B_Salt_2026';

function hashearContrasena(password: string): string {
  return crypto.createHash('sha256').update(`${password}_${SALT}`).digest('hex');
}

async function querySupabase(endpoint: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function POST(req: NextRequest) {
  try {
    const { correo, password } = await req.json();

    if (!correo?.trim() || !password) {
      return NextResponse.json(
        { ok: false, error: 'Correo y contraseña son obligatorios.' },
        { status: 400 }
      );
    }

    const emailNorm = correo.trim().toLowerCase();
    const usuarios = await querySupabase(
      `usuarios?correo=eq.${encodeURIComponent(emailNorm)}&select=id,id_empresa,nombre,apellido,correo,contrasena_hash,rol,activo&limit=1`
    );

    const usuario = Array.isArray(usuarios) && usuarios[0] ? usuarios[0] : null;
    if (!usuario) {
      return NextResponse.json(
        { ok: false, error: 'No existe una cuenta registrada con este correo.' },
        { status: 401 }
      );
    }

    if (!usuario.activo) {
      return NextResponse.json(
        { ok: false, error: 'Esta cuenta se encuentra inactiva. Contacta al soporte.' },
        { status: 403 }
      );
    }

    // Validar contraseña
    const hashCalculado = hashearContrasena(password);
    const esValida =
      password === usuario.contrasena_hash || hashCalculado === usuario.contrasena_hash;

    if (!esValida) {
      return NextResponse.json(
        { ok: false, error: 'Contraseña incorrecta. Por favor intenta de nuevo.' },
        { status: 401 }
      );
    }

    // Obtener datos de la empresa
    const empresas = await querySupabase(
      `empresas?id=eq.${usuario.id_empresa}&select=id,nombre,ruc,ciudad&limit=1`
    );
    const empresa = Array.isArray(empresas) && empresas[0] ? empresas[0] : null;
    const nombreEmpresa = empresa?.nombre || 'Corporación AsistenciaAI SAC';

    // Generar JSON Web Token (JWT)
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
      mensaje: 'Acceso autorizado con JWT.',
      token,
      data: {
        token,
        usuario: {
          id: usuario.id,
          id_empresa: usuario.id_empresa,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          correo: usuario.correo,
          rol: usuario.rol,
        },
        empresa: empresa || {
          id: usuario.id_empresa,
          nombre: nombreEmpresa,
        },
      },
    });

    response.cookies.set('asistencia_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 horas
    });

    return response;
  } catch (error: any) {
    console.error('[API /api/auth/login] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
