import tls from 'node:tls';

export function enviarSmtpGmail({
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
    const pass = appPassword.replace(/\s+/g, '');
    const socket = tls.connect({ host: 'smtp.gmail.com', port: 465, servername: 'smtp.gmail.com' });
    let paso = 0;
    let buffer = '';

    const send = (c: string) => socket.write(`${c}\r\n`);
    socket.setTimeout(10000, () => { socket.destroy(); reject(new Error('Timeout SMTP')); });
    socket.on('error', reject);
    socket.on('data', (d) => {
      buffer += d.toString();
      if (!buffer.endsWith('\r\n')) return;
      const lines = buffer.trim().split('\r\n');
      const code = parseInt(lines[lines.length - 1].slice(0, 3), 10);
      buffer = '';

      if (code >= 400) { socket.end(); return reject(new Error(`Error SMTP ${code}`)); }
      if (paso === 0 && code === 220) { paso = 1; send('EHLO asistencia-ia.local'); }
      else if (paso === 1 && code === 250) { paso = 2; send('AUTH LOGIN'); }
      else if (paso === 2 && code === 334) { paso = 3; send(Buffer.from(remitente).toString('base64')); }
      else if (paso === 3 && code === 334) { paso = 4; send(Buffer.from(pass).toString('base64')); }
      else if (paso === 4 && code === 235) { paso = 5; send(`MAIL FROM:<${remitente}>`); }
      else if (paso === 5 && code === 250) { paso = 6; send(`RCPT TO:<${destinatario}>`); }
      else if (paso === 6 && code === 250) { paso = 7; send('DATA'); }
      else if (paso === 7 && code === 354) {
        paso = 8;
        send(`From: "Control Asistencia" <${remitente}>\r\nTo: <${destinatario}>\r\nSubject: =?UTF-8?B?${Buffer.from(asunto).toString('base64')}?=\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${html}\r\n.`);
      } else if (paso === 8 && code === 250) {
        paso = 9;
        send('QUIT');
        socket.end();
        resolve(true);
      }
    });
  });
}

