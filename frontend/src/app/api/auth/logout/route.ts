import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    ok: true,
    mensaje: 'Sesión cerrada correctamente.',
  });

  response.cookies.delete('asistencia_token');
  return response;
}

