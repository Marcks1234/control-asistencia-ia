import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://txtftxqhnqxpanptiudt.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

export async function GET() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/planes?activo=eq.true&order=precio_mensual.asc`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Error al consultar planes en Supabase');
    }

    const planes = await res.json();
    return NextResponse.json({ ok: true, planes });
  } catch (error: any) {
    console.error('[API /api/planes] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

