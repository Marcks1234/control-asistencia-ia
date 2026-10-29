import { NextRequest, NextResponse } from 'next/server';
import { verificarTokenJWT } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    let token = req.cookies.get('asistencia_token')?.value || null;

    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      }
    }

    if (!token) {
      return NextResponse.json(
        { ok: false, autenticado: false, error: 'No hay sesión JWT activa.' },
        { status: 401 }
      );
    }

    const payload = verificarTokenJWT(token);

    return NextResponse.json({
      ok: true,
      autenticado: true,
      usuario: {
        id: payload.sub,
        id_empresa: payload.id_empresa,
        nombre: payload.nombre,
        apellido: payload.apellido,
        correo: payload.correo,
        rol: payload.rol,
        empresa_nombre: payload.empresa_nombre,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, autenticado: false, error: error.message || 'Token JWT inválido.' },
      { status: 401 }
    );
  }
}

