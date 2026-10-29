import { NextRequest, NextResponse } from 'next/server';
import { querySupabase } from '@/lib/supabase';
import { hashearContrasena } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const { correo, codigo, nuevaPassword } = await req.json();
    if (!correo?.trim() || !codigo?.trim() || !nuevaPassword) {
      return NextResponse.json({ ok: false, error: 'Todos los campos son obligatorios.' }, { status: 400 });
    }
    if (nuevaPassword.length < 6) {
      return NextResponse.json({ ok: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
    }

    const emailNorm = correo.trim().toLowerCase();
    const usuarios = await querySupabase<any[]>(
      `usuarios?correo=eq.${encodeURIComponent(emailNorm)}&select=id,correo,codigo_recuperacion,expiracion_recuperacion&limit=1`
    );
    const usuario = Array.isArray(usuarios) && usuarios[0] ? usuarios[0] : null;

    if (!usuario) return NextResponse.json({ ok: false, error: 'No se encontró una cuenta con este correo.' }, { status: 404 });
    if (!usuario.codigo_recuperacion || usuario.codigo_recuperacion !== codigo.trim()) {
      return NextResponse.json({ ok: false, error: 'El código de verificación es incorrecto.' }, { status: 400 });
    }
    if (!usuario.expiracion_recuperacion || new Date(usuario.expiracion_recuperacion) < new Date()) {
      return NextResponse.json({ ok: false, error: 'El código de verificación ha expirado.' }, { status: 400 });
    }

    await querySupabase(`usuarios?correo=eq.${encodeURIComponent(emailNorm)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        contrasena_hash: hashearContrasena(nuevaPassword),
        codigo_recuperacion: null,
        expiracion_recuperacion: null,
      }),
    });

    return NextResponse.json({ ok: true, mensaje: 'Contraseña actualizada con éxito.' });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Error al restablecer la contraseña.' }, { status: 500 });
  }
}
