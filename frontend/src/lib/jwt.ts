import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'AsistenciaAI_JWT_Secret_Key_2026_B2B';

export interface JWTPayload {
  sub: string;
  id_empresa: string;
  correo: string;
  nombre: string;
  apellido: string;
  rol: string;
  empresa_nombre: string;
  iat?: number;
  exp?: number;
}

function base64UrlEncode(strOrBuffer: string | Buffer): string {
  const buf = Buffer.isBuffer(strOrBuffer)
    ? strOrBuffer
    : Buffer.from(strOrBuffer, 'utf8');
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Genera un token JWT estándar (HS256) firmado con HMAC-SHA256
 */
export function generarTokenJWT(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  expiresInSeconds = 86400
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const ahora = Math.floor(Date.now() / 1000);

  const cuerpo: JWTPayload = {
    ...payload,
    iat: ahora,
    exp: ahora + expiresInSeconds,
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(cuerpo));
  const data = `${headerEncoded}.${payloadEncoded}`;

  const signature = base64UrlEncode(
    crypto.createHmac('sha256', JWT_SECRET).update(data).digest()
  );

  return `${data}.${signature}`;
}

/**
 * Verifica la firma y fecha de expiración de un token JWT (HS256)
 */
export function verificarTokenJWT(token: string): JWTPayload {
  if (!token || typeof token !== 'string') {
    throw new Error('Token JWT no proporcionado.');
  }

  const partes = token.split('.');
  if (partes.length !== 3) {
    throw new Error('Formato de token JWT inválido.');
  }

  const [headerEncoded, payloadEncoded, signatureRecibida] = partes;
  const data = `${headerEncoded}.${payloadEncoded}`;

  const signatureEsperada = base64UrlEncode(
    crypto.createHmac('sha256', JWT_SECRET).update(data).digest()
  );

  if (signatureRecibida !== signatureEsperada) {
    throw new Error('Firma de token JWT inválida.');
  }

  const payload: JWTPayload = JSON.parse(base64UrlDecode(payloadEncoded));
  const ahora = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp < ahora) {
    throw new Error('El token JWT ha expirado.');
  }

  return payload;
}

