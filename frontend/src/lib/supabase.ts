import { NextRequest } from 'next/server';
import { verificarTokenJWT } from './jwt';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://txtftxqhnqxpanptiudt.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const esUuidValido = (v?: string | null): boolean => Boolean(v && UUID_REGEX.test(v.trim()));
export const sanitizarUuid = (v?: string | null): string => (v && UUID_REGEX.test(v.trim()) ? v.trim() : '');

const SQL_PATTERNS = [
  /(\bOR\b|\bAND\b)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i,
  /(\bOR\b|\bAND\b)\s+['"][a-z0-9_]+['"]\s*=\s*['"][a-z0-9_]+['"]/i,
  /'\s*(\bOR\b|\bAND\b)\s+/i,
  /\b(DROP|TRUNCATE|ALTER|CREATE)\s+(TABLE|DATABASE|SCHEMA|VIEW|INDEX|USER)\b/i,
  /\b(DELETE\s+FROM|INSERT\s+INTO|UPDATE\s+[a-z0-9_.]+\s+SET|UNION\s+(ALL\s+)?SELECT)\b/i,
  /\bSELECT\b[\s\S]{1,80}\bFROM\b/i,
  /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|EXEC|--)/i,
  /'.*--|\/\*[\s\S]*?\*\/|\b(xp_cmdshell|information_schema|pg_sleep)\b/i,
];

export const detectarInyeccionSQL = (texto: string): boolean =>
  Boolean(texto && SQL_PATTERNS.some((r) => r.test(texto.trim())));

export async function querySupabase<T = any>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      ...options,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      const errTxt = await res.text().catch(() => '');
      console.error(`[querySupabase error ${res.status}] /${endpoint}:`, errTxt);
      return null;
    }
    const contentType = res.headers.get('content-type');
    return contentType?.includes('application/json') ? ((await res.json()) as T) : (true as unknown as T);
  } catch {
    return null;
  }
}

export function resolverContextoEmpresa(req: NextRequest, fallbackEmpresaId?: string) {
  let idEmpresa = fallbackEmpresaId?.trim() || '';
  let [nombreUsuario, idUsuario, empresaNombre, rol] = ['', '', '', ''];

  const authHeader = req.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : req.cookies.get('asistencia_token')?.value || null;

  if (token) {
    try {
      const p = verificarTokenJWT(token);
      if (p?.id_empresa) idEmpresa = p.id_empresa;
      if (p?.nombre) nombreUsuario = p.nombre;
      if (p?.sub) idUsuario = p.sub;
      if (p?.empresa_nombre) empresaNombre = p.empresa_nombre;
      if (p?.rol) rol = p.rol;
    } catch {}
  }

  if (!idEmpresa) {
    const qEmp = req.nextUrl.searchParams.get('id_empresa');
    if (qEmp?.trim()) idEmpresa = qEmp.trim();
  }

  return {
    idEmpresa: sanitizarUuid(idEmpresa),
    nombreUsuario,
    idUsuario: sanitizarUuid(idUsuario),
    empresaNombre,
    rol,
  };
}

export const resolverIdEmpresa = (req: NextRequest): string => resolverContextoEmpresa(req).idEmpresa;

export function getClientAuth(): { headers: Record<string, string>; idEmpresa?: string } {
  if (typeof window === 'undefined') return { headers: {} };
  const token = localStorage.getItem('asistencia_jwt');
  const usuarioRaw = localStorage.getItem('asistencia_usuario');
  let idEmpresa: string | undefined;

  if (usuarioRaw) {
    try {
      const u = JSON.parse(usuarioRaw);
      if (u?.id_empresa) idEmpresa = u.id_empresa;
    } catch {}
  }

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return { headers, idEmpresa };
}
