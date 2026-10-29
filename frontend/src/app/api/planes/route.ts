import { NextResponse } from 'next/server';
import { querySupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const planes = await querySupabase('planes?activo=eq.true&order=precio_mensual.asc');
    return NextResponse.json({ ok: true, planes: Array.isArray(planes) ? planes : [] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
