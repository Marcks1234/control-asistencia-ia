import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { querySupabase } from '@/lib/supabase';
import { enviarSmtpGmail } from '@/lib/smtp';

export async function POST(req: NextRequest) {
  try {
    const { correo } = await req.json();
    if (!correo?.trim() || !correo.includes('@')) {
      return NextResponse.json({ ok: false, error: 'Ingresa un correo electrónico válido.' }, { status: 400 });
    }

    const emailNorm = correo.trim().toLowerCase();
    const usuarios = await querySupabase<any[]>(
      `usuarios?correo=eq.${encodeURIComponent(emailNorm)}&select=id,nombre,apellido,correo,activo&limit=1`
    );
    const usuario = Array.isArray(usuarios) && usuarios[0] ? usuarios[0] : null;

    if (!usuario) {
      return NextResponse.json({ ok: false, error: 'No existe una cuenta con ese correo.' }, { status: 404 });
    }

    const codigo = crypto.randomInt(100000, 999999).toString();
    const expiracionIso = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await querySupabase(`usuarios?correo=eq.${encodeURIComponent(emailNorm)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ codigo_recuperacion: codigo, expiracion_recuperacion: expiracionIso }),
    });

    const gmailUser = process.env.GMAIL_USER?.trim();
    const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();
    let enviado = false;

    const destinatario = usuario.correo === 'admin@gmail.com' && gmailUser ? gmailUser : usuario.correo;
    const html = `
      <div style="font-family:sans-serif;padding:20px;background:#f8fafc;border-radius:8px;max-width:480px">
        <h2 style="color:#273656">Recuperación de Contraseña · Asistencia-IA</h2>
        <p>Tu código de verificación de 6 dígitos es:</p>
        <div style="background:#273656;color:#fff;font-size:26px;font-weight:bold;letter-spacing:5px;padding:12px;text-align:center;border-radius:6px">
          ${codigo}
        </div>
        <p style="color:#6b7280;font-size:12px;margin-top:16px">Válido por 15 minutos.</p>
      </div>`;

    if (gmailUser && gmailPass) {
      await enviarSmtpGmail({ remitente: gmailUser, appPassword: gmailPass, destinatario, asunto: `Código: ${codigo} - Asistencia-IA`, html });
      enviado = true;
    }

    return NextResponse.json({
      ok: true,
      mensaje: enviado ? `Código enviado a ${destinatario}.` : `Código de verificación generado.`,
      data: { correo: usuario.correo, enviadoPorGmail: enviado, ...(enviado ? {} : { codigoVerificacion: codigo }) },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Error al solicitar recuperación.' }, { status: 500 });
  }
}
