import tls from 'node:tls';

/**
 * Envía un correo mediante SMTP TLS directo a smtp.gmail.com:465
 * No requiere dependencias externas y funciona con Contraseña de Aplicación de Google.
 */
function enviarSmtpGmail({ remitente, appPassword, destinatario, asunto, html }) {
  return new Promise((resolve, reject) => {
    const passLimpia = appPassword.replace(/\s+/g, '');
    const socket = tls.connect(
      {
        host: 'smtp.gmail.com',
        port: 465,
        servername: 'smtp.gmail.com',
        rejectUnauthorized: true,
      },
      () => {}
    );

    let paso = 0;
    let buffer = '';

    const enviarComando = (cmd) => {
      socket.write(`${cmd}\r\n`);
    };

    socket.setTimeout(12000, () => {
      socket.destroy();
      reject(new Error('Tiempo de espera agotado al conectar con smtp.gmail.com'));
    });

    socket.on('error', (err) => {
      reject(err);
    });

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

export const emailService = {
  /**
   * Envía el código de recuperación de 6 dígitos al correo del usuario vía Gmail
   */
  async enviarCodigoRecuperacionGmail({ correoDestino, nombreUsuario, codigo }) {
    const gmailUser = process.env.GMAIL_USER?.trim();
    const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();

    // Si se prueba con el correo demo admin@gmail.com, redirigir a la bandeja real configurada en GMAIL_USER
    const destinatarioFinal =
      correoDestino.trim().toLowerCase() === 'admin@gmail.com' && gmailUser
        ? gmailUser
        : correoDestino.trim();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #f8fafc;">
        <h2 style="color: #273656; margin-top: 0;">Asistencia-IA · Recuperación de Contraseña</h2>
        <p style="color: #374151; font-size: 14px; line-height: 1.5;">
          Hola <strong>${nombreUsuario || 'Usuario'}</strong> (${correoDestino}), hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Asistencia-IA</strong>.
        </p>
        <p style="color: #374151; font-size: 14px;">Usa el siguiente código de verificación de 6 dígitos:</p>
        <div style="background-color: #273656; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: 6px; text-align: center; padding: 16px; border-radius: 8px; margin: 20px 0;">
          ${codigo}
        </div>
        <p style="color: #6b7280; font-size: 12px;">
          Este código expirará en <strong>15 minutos</strong>. Si no solicitaste este cambio, puedes ignorar este mensaje de forma segura.
        </p>
      </div>
    `;

    if (gmailUser && gmailPass) {
      await enviarSmtpGmail({
        remitente: gmailUser,
        appPassword: gmailPass,
        destinatario: destinatarioFinal,
        asunto: `Código de recuperación: ${codigo} - Asistencia-IA`,
        html,
      });
      return { enviadoPorGmail: true, destinatarioFinal };
    }

    console.log(`[EmailService] Código de recuperación para ${correoDestino}: ${codigo}`);
    return { enviadoPorGmail: false, destinatarioFinal };
  },
};
