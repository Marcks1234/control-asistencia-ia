import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import tls from 'node:tls';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://txtftxqhnqxpanptiudt.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

/**
 * Envía un correo real vía SMTP TLS a smtp.gmail.com:465
 */
function enviarSmtpGmail({
  remitente,
  appPassword,
  destinatario,
  asunto,
  html,
}: {
  remitente: string;
  appPassword: string;
  destinatario: string;
  asunto: string;
  html: string;
}): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const passLimpia = appPassword.replace(/\s+/g, '');
    const socket = tls.connect({
      host: 'smtp.gmail.com',
      port: 465,
      servername: 'smtp.gmail.com',
      rejectUnauthorized: true,
    });

    let paso = 0;
    let buffer = '';

    const enviarComando = (cmd: string) => {
      socket.write(`${cmd}\r\n`);
    };

    socket.setTimeout(12000, () => {
      socket.destroy();
      reject(new Error('Tiempo de espera agotado al conectar con smtp.gmail.com'));
    });

    socket.on('error', (err) => reject(err));

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      if (!buffer.endsWith('\r\n')) return;

      const lineas = buffer.trim().split('\r\n');
      const ultimaLinea = lineas[lineas.length - 1];
      if (/^\d{3}-/.test(ultimaLinea)) return;

      const codigo = parseInt(ultimaLinea.slice(0, 3), 10);
      buffer = '';

      if (codigo >= 400) {
        socket.end();
        return reject(new Error(`Error SMTP Gmail (${codigo}): ${ultimaLinea}`));
      }

      if (paso === 0 && codigo === 220) {
        paso = 1;
        enviarComando('EHLO asistencia-ia.local');
      } else if (paso === 1 && codigo === 250) {
        paso = 2;
        enviarComando('AUTH LOGIN');
      } else if (paso === 2 && codigo === 334) {
        paso = 3;
        enviarComando(Buffer.from(remitente, 'utf8').toString('base64'));
      } else if (paso === 3 && codigo === 334) {
        paso = 4;
        enviarComando(Buffer.from(passLimpia, 'utf8').toString('base64'));
      } else if (paso === 4 && codigo === 235) {
        paso = 5;
        enviarComando(`MAIL FROM:<${remitente}>`);
      } else if (paso === 5 && codigo === 250) {
        paso = 6;
        enviarComando(`RCPT TO:<${destinatario}>`);
      } else if (paso === 6 && codigo === 250) {
        paso = 7;
        enviarComando('DATA');
      } else if (paso === 7 && codigo === 354) {
        paso = 8;
        const asuntoBase64 = Buffer.from(asunto, 'utf8').toString('base64');
        const mensajeMime = [
          `From: "Asistencia-IA Seguridad" <${remitente}>`,
          `To: <${destinatario}>`,
          `Subject: =?UTF-8?B?${asuntoBase64}?=`,
          'MIME-Version: 1.0',
          'Content-Type: text/html; charset=UTF-8',
          '',
          html,
          '.',
        ].join('\r\n');
        enviarComando(mensajeMime);
      } else if (paso === 8 && codigo === 250) {
        paso = 9;
        enviarComando('QUIT');
        socket.end();
        resolve(true);
      }
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const { correo } = await req.json();

    if (!correo?.trim() || !correo.includes('@')) {
      return NextResponse.json(
        { ok: false, error: 'Ingresa un correo electrónico válido.' },
        { status: 400 }
      );
    }

    const emailNorm = correo.trim().toLowerCase();

    // 1. Verificar que el usuario exista en Supabase
    const resUser = await fetch(
      `${SUPABASE_URL}/rest/v1/usuarios?correo=eq.${encodeURIComponent(emailNorm)}&select=id,nombre,apellido,correo,activo&limit=1`,
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
        { ok: false, error: 'No existe una cuenta registrada con ese correo electrónico.' },
        { status: 404 }
      );
    }

    // 2. Generar código de 6 dígitos con expiración de 15 minutos
    const codigo = crypto.randomInt(100000, 999999).toString();
    const expiracionIso = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // 3. Guardar código en Supabase
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
          codigo_recuperacion: codigo,
          expiracion_recuperacion: expiracionIso,
        }),
      }
    );

    if (!resPatch.ok) {
      throw new Error('No se pudo almacenar el código de recuperación en la base de datos.');
    }

    // 4. Enviar correo vía Gmail SMTP
    const gmailUser = process.env.GMAIL_USER?.trim();
    const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();
    let enviadoPorGmail = false;

    // Si es la cuenta demo admin@gmail.com, enviar a la bandeja oficial del proyecto (GMAIL_USER)
    const destinatarioFinal =
      usuario.correo === 'admin@gmail.com' && gmailUser ? gmailUser : usuario.correo;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #f8fafc;">
        <h2 style="color: #273656; margin-top: 0;">Asistencia-IA · Recuperación de Contraseña</h2>
        <p style="color: #374151; font-size: 14px; line-height: 1.5;">
          Hola <strong>${usuario.nombre || 'Usuario'}</strong> (${usuario.correo}), hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Asistencia-IA</strong>.
        </p>
        <p style="color: #374151; font-size: 14px;">Ingresa el siguiente código de verificación de 6 dígitos:</p>
        <div style="background-color: #273656; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: 6px; text-align: center; padding: 16px; border-radius: 8px; margin: 20px 0;">
          ${codigo}
        </div>
        <p style="color: #6b7280; font-size: 12px;">
          Este código es válido por <strong>15 minutos</strong>. Si no solicitaste este cambio, puedes ignorar este correo.
        </p>
      </div>
    `;

    if (gmailUser && gmailPass) {
      await enviarSmtpGmail({
        remitente: gmailUser,
        appPassword: gmailPass,
        destinatario: destinatarioFinal,
        asunto: `Código de verificación: ${codigo} - Asistencia-IA`,
        html,
      });
      enviadoPorGmail = true;
    }

    return NextResponse.json({
      ok: true,
      mensaje: enviadoPorGmail
        ? `Hemos enviado el código de 6 dígitos por Gmail a ${destinatarioFinal}.`
        : `Código de verificación generado para ${usuario.correo}.`,
      data: {
        correo: usuario.correo,
        destinatarioFinal,
        enviadoPorGmail,
        ...(enviadoPorGmail ? {} : { codigoVerificacion: codigo }),
      },
    });
  } catch (error: any) {
    console.error('[API /api/auth/recuperar] Error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Error al solicitar la recuperación de contraseña.' },
      { status: 500 }
    );
  }
}
