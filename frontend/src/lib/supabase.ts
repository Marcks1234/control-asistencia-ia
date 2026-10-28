import { NextRequest } from 'next/server';
import { verificarTokenJWT } from './jwt';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://txtftxqhnqxpanptiudt.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

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
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type');
    return contentType?.includes('application/json') ? ((await res.json()) as T) : (true as unknown as T);
  } catch {
    return null;
  }
}

export function resolverContextoEmpresa(req: NextRequest, fallbackEmpresaId?: string) {
  let idEmpresa = fallbackEmpresaId?.trim() || '';
  let nombreUsuario = '';
  let idUsuario = '';
  let empresaNombre = '';
  let rol = '';

  const authHeader = req.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) token = req.cookies.get('asistencia_token')?.value || null;

  if (token) {
    try {
      const payload = verificarTokenJWT(token);
      if (payload?.id_empresa) idEmpresa = payload.id_empresa;
      if (payload?.nombre) nombreUsuario = payload.nombre;
      if (payload?.sub) idUsuario = payload.sub;
      if (payload?.empresa_nombre) empresaNombre = payload.empresa_nombre;
      if (payload?.rol) rol = payload.rol;
    } catch {}
  }

  if (!idEmpresa) {
    const queryEmpresa = req.nextUrl.searchParams.get('id_empresa');
    if (queryEmpresa?.trim()) idEmpresa = queryEmpresa.trim();
  }

  return { idEmpresa, nombreUsuario, idUsuario, empresaNombre, rol };
}

export function resolverIdEmpresa(req: NextRequest): string {
  return resolverContextoEmpresa(req).idEmpresa;
}

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

