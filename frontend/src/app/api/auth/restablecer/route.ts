import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://txtftxqhnqxpanptiudt.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
const SALT = 'AsistenciaAI_B2B_Salt_2026';

function hashearContrasena(password: string): string {
  return crypto.createHash('sha256').update(`${password}_${SALT}`).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { correo, codigo, nuevaPassword } = await req.json();

    if (!correo?.trim() || !codigo?.trim() || !nuevaPassword) {
      return NextResponse.json(
        { ok: false, error: 'Todos los campos son obligatorios.' },
        { status: 400 }
      );
    }

    if (nuevaPassword.length < 6) {
      return NextResponse.json(
        { ok: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    const emailNorm = correo.trim().toLowerCase();

    // 1. Consultar usuario y su código de recuperación actual
    const resUser = await fetch(
      `${SUPABASE_URL}/rest/v1/usuarios?correo=eq.${encodeURIComponent(emailNorm)}&select=id,correo,codigo_recuperacion,expiracion_recuperacion&limit=1`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        cache: 'no-store',
      }
    );

    const usuarios = resUser.ok ? await resUser.json() : [];
    const usuario = Array.isArray(usuarios) && usuarios[0] ? usuarios[0] : null;

    if (!usuario) {
      return NextResponse.json(
        { ok: false, error: 'No se encontró una cuenta con este correo.' },
        { status: 404 }
      );
    }

    if (!usuario.codigo_recuperacion || usuario.codigo_recuperacion !== codigo.trim()) {
      return NextResponse.json(
        { ok: false, error: 'El código de verificación de 6 dígitos es incorrecto.' },
        { status: 400 }
      );
    }

    if (
      !usuario.expiracion_recuperacion ||
      new Date(usuario.expiracion_recuperacion) < new Date()
    ) {
      return NextResponse.json(
        { ok: false, error: 'El código de verificación ha expirado. Solicita uno nuevo.' },
        { status: 400 }
      );
    }

    // 2. Hashear nueva contraseña y limpiar el código usado
    const nuevoHash = hashearContrasena(nuevaPassword);

    const resPatch = await fetch(
      `${SUPABASE_URL}/rest/v1/usuarios?correo=eq.${encodeURIComponent(emailNorm)}`,
      {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          contrasena_hash: nuevoHash,
          codigo_recuperacion: null,
          expiracion_recuperacion: null,
        }),
      }
    );

    if (!resPatch.ok) {
      throw new Error('No se pudo actualizar la contraseña en la base de datos.');
    }

    return NextResponse.json({
      ok: true,
      mensaje: 'Contraseña actualizada con éxito. Redirigiendo al inicio de sesión...',
    });
  } catch (error: any) {
    console.error('[API /api/auth/restablecer] Error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Error al restablecer la contraseña.' },
      { status: 500 }
    );
  }
}

